"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { calculateMatch, MatchBreakdown } from "@/lib/matching";
import { UserProfile, UserPreferences } from "@/types";
import BottomNav from "@/components/BottomNav";

interface CardData {
  profile: UserProfile;
  matchPercentage: number;
  breakdown: MatchBreakdown;
}

export default function DiscoverPage() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | "up" | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const startPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch real profiles from Supabase
  useEffect(() => {
    async function fetchProfiles() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Auto-sync: ensure current user's profile is in the profiles table
      const userProfile = user.user_metadata?.profile as Record<string, unknown> | undefined;
      if (userProfile) {
        await supabase.from("profiles").upsert({
          user_id: user.id,
          name: (userProfile.name as string) || "",
          age: (userProfile.age as number) || null,
          bio: (userProfile.bio as string) || "",
          location: (userProfile.location as string) || "",
          budget_min: (userProfile.budget_min as number) || 500,
          budget_max: (userProfile.budget_max as number) || 1200,
          looking_for: (userProfile.looking_for as string) || "both",
          is_student: (userProfile.is_student as boolean) || false,
          photos: (userProfile.photos as string[]) || [],
        }, { onConflict: "user_id" });
      }

      // Auto-sync quiz answers too
      const quizData = user.user_metadata?.quiz_answers as Record<string, unknown> | undefined;
      if (quizData) {
        await supabase.from("quiz_answers").upsert({
          user_id: user.id,
          sleep_schedule: (quizData.sleep_schedule as string) || null,
          cleanliness: (quizData.cleanliness as string) || null,
          noise_level: (quizData.noise_level as string) || null,
          guests: (quizData.guests as string) || null,
          smoking: (quizData.smoking as string) || null,
          pets: (quizData.pets as string) || null,
          budget_range: (quizData.budget_range as string) || null,
          hobbies: (quizData.hobbies as string[]) || [],
          is_student: (quizData.is_student as boolean) || false,
        }, { onConflict: "user_id" });
      }

      // Get current user's quiz answers (their preferences)
      const { data: myQuiz } = await supabase
        .from("quiz_answers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const myPrefs: UserPreferences = myQuiz ? {
        user_id: user.id,
        schedule: myQuiz.schedule || "regular",
        social: myQuiz.social || "sometimes",
        cleanliness: myQuiz.cleanliness || "tidy",
        budget_range: myQuiz.budget_range || "600-900",
        hobbies: myQuiz.hobbies || [],
        pets: myQuiz.pets || "flexible",
        is_student: myQuiz.is_student || false,
      } : {
        user_id: user.id,
        schedule: "regular",
        social: "sometimes",
        cleanliness: "tidy",
        budget_range: "600-900",
        hobbies: [],
        pets: "flexible",
      };

      // Get other users' profiles (exclude self)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", user.id);

      if (!profiles || profiles.length === 0) { setLoading(false); return; }

      // Get all quiz answers for those profiles
      const profileUserIds = profiles.map((p: Record<string, unknown>) => p.user_id as string);
      const { data: quizAnswers } = await supabase
        .from("quiz_answers")
        .select("*")
        .in("user_id", profileUserIds);

      const quizMap: Record<string, UserPreferences> = {};
      (quizAnswers || []).forEach((q: Record<string, unknown>) => {
        quizMap[q.user_id as string] = {
          user_id: q.user_id as string,
          schedule: (q.schedule as UserPreferences["schedule"]) || null,
          social: (q.social as UserPreferences["social"]) || null,
          cleanliness: (q.cleanliness as UserPreferences["cleanliness"]) || null,
          budget_range: (q.budget_range as UserPreferences["budget_range"]) || null,
          hobbies: (q.hobbies as string[]) || [],
          pets: (q.pets as UserPreferences["pets"]) || null,
          is_student: (q.is_student as boolean) || false,
        };
      });

      // Calculate matches
      const results = profiles
        .map((row: Record<string, unknown>) => {
          const profile: UserProfile = {
            id: (row.user_id as string) || (row.id as string),
            name: (row.name as string) || "PadPal User",
            age: (row.age as number) || 25,
            bio: (row.bio as string) || "",
            location: (row.location as string) || "London",
            postcode: (row.postcode as string) || "",
            budget_min: (row.budget_min as number) || 500,
            budget_max: (row.budget_max as number) || 1000,
            looking_for: (row.looking_for as UserProfile["looking_for"]) || "both",
            photos: (row.photos as string[]) || [],
            is_verified_email: true,
            is_verified_phone: false,
            is_student: (row.is_student as boolean) || false,
            occupation: (row.occupation as string) || "PadPal Member",
            university: (row.university as string) || undefined,
            created_at: (row.created_at as string) || "",
            updated_at: (row.updated_at as string) || "",
          };

          const theirPrefs = quizMap[profile.id] || {
            user_id: profile.id,
            schedule: null, social: null, cleanliness: null,
            budget_range: null, hobbies: [], pets: null,
          };

          const { percentage, breakdown } = calculateMatch(myPrefs, theirPrefs);
          return { profile, matchPercentage: percentage, breakdown };
        })
        .sort((a, b) => b.matchPercentage - a.matchPercentage);

      setCards(results);
      setLoading(false);
    }
    fetchProfiles();
  }, []);

  const currentCard = cards[currentIndex];

  // Drag handling
  const handlePointerDown = (e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setDragX(dx);
    setDragY(dy);
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    const threshold = 100;
    const upThreshold = -80;

    if (dragX > threshold) {
      performAction("like");
    } else if (dragX < -threshold) {
      performAction("pass");
    } else if (dragY < upThreshold) {
      performAction("superlike");
    } else {
      // Snap back
      setDragX(0);
      setDragY(0);
    }
    setIsDragging(false);
  }, [isDragging, dragX, dragY]); // eslint-disable-line react-hooks/exhaustive-deps

  const performAction = async (action: "like" | "pass" | "superlike") => {
    setSwipeDirection(action === "pass" ? "left" : action === "superlike" ? "up" : "right");
    setLastAction(action === "like" ? "Liked!" : action === "pass" ? "Passed" : "Superliked!");

    // Save interaction to Supabase
    if (currentCard) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("interactions").upsert({
          user_id: user.id,
          target_id: currentCard.profile.id,
          action,
        });

        // Check for mutual like (match!)
        if (action === "like" || action === "superlike") {
          const { data: reverse } = await supabase
            .from("interactions")
            .select("action")
            .eq("user_id", currentCard.profile.id)
            .eq("target_id", user.id)
            .in("action", ["like", "superlike"])
            .single();

          if (reverse) {
            // It's a match! Create conversation and redirect
            const ids = [user.id, currentCard.profile.id].sort();
            await supabase.from("conversations").upsert({
              user1_id: ids[0],
              user2_id: ids[1],
            }, { onConflict: "user1_id,user2_id" });

            setTimeout(() => {
              window.location.href = `/match?with=${currentCard.profile.id}&pct=${currentCard.matchPercentage}`;
            }, 350);
            return;
          }
        }
      }
    }

    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setSwipeDirection(null);
      setDragX(0);
      setDragY(0);
      setTimeout(() => setLastAction(null), 800);
    }, 300);
  };

  // Card transform
  const rotation = isDragging ? dragX * 0.1 : 0;
  const cardStyle = swipeDirection
    ? {
        transform: `translateX(${swipeDirection === "left" ? -500 : swipeDirection === "right" ? 500 : 0}px) translateY(${swipeDirection === "up" ? -500 : 0}px) rotate(${swipeDirection === "left" ? -30 : swipeDirection === "right" ? 30 : 0}deg)`,
        opacity: 0,
        transition: "all 0.3s ease-out",
      }
    : {
        transform: `translateX(${dragX}px) translateY(${Math.min(dragY, 0)}px) rotate(${rotation}deg)`,
        transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      };

  // Overlay opacity based on drag distance
  const likeOpacity = Math.min(Math.max(dragX / 100, 0), 1);
  const passOpacity = Math.min(Math.max(-dragX / 100, 0), 1);
  const superlikeOpacity = Math.min(Math.max(-dragY / 80, 0), 1);

  // Match color
  const matchColor = (pct: number) => {
    if (pct >= 80) return "text-match-great";
    if (pct >= 60) return "text-match-good";
    if (pct >= 40) return "text-match-okay";
    return "text-match-low";
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-dark">No profiles yet</h2>
          <p className="text-dark-secondary">Be the first to create a profile and start matching!</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (currentIndex >= cards.length) {
    return (
      <div className="flex min-h-dvh flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-dark">All caught up!</h2>
          <p className="text-dark-secondary">Check back later for new flatmates in your area.</p>
          <button
            onClick={() => setCurrentIndex(0)}
            className="mt-6 rounded-[var(--radius-lg)] bg-primary px-6 py-3 font-semibold text-white shadow-[var(--shadow-button)]"
          >
            Start Over
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-primary">
            <span className="text-sm font-bold text-white">P</span>
          </div>
          <span className="text-lg font-bold text-dark">
            Pad<span className="text-primary">Pal</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/chats" className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface" aria-label="Messages">
            <svg className="h-5 w-5 text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Action feedback */}
      {lastAction && (
        <div className="absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-full bg-dark/80 px-4 py-2 text-sm font-medium text-white animate-fade-in-up">
          {lastAction}
        </div>
      )}

      {/* Card Stack */}
      <div className="relative flex flex-1 items-center justify-center px-4 py-4">
        {/* Background card (next) */}
        {currentIndex + 1 < cards.length && (
          <div className="absolute inset-x-4 mx-auto max-w-md overflow-hidden rounded-[var(--radius-xl)] bg-white shadow-[var(--shadow-card)]"
            style={{ transform: "scale(0.95)", opacity: 0.6, top: "1.5rem", bottom: "1.5rem" }}
          />
        )}

        {/* Current card */}
        <div
          ref={cardRef}
          className="relative w-full max-w-md cursor-grab overflow-hidden rounded-[var(--radius-xl)] bg-white shadow-[var(--shadow-card)] active:cursor-grabbing no-select touch-action-pan"
          style={cardStyle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => isDragging && handlePointerUp()}
        >
          {/* Photo */}
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={currentCard.profile.photos[0]}
              alt={currentCard.profile.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 448px) 100vw, 448px"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* Match badge */}
            <div className="absolute right-3 top-3 glass rounded-full px-3 py-1.5">
              <span className={`text-sm font-bold ${matchColor(currentCard.matchPercentage)}`}>
                {currentCard.matchPercentage}% match
              </span>
            </div>

            {/* Verified badge */}
            {currentCard.profile.is_verified_email && currentCard.profile.is_verified_phone && (
              <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-success/90 px-2.5 py-1">
                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold text-white">Verified</span>
              </div>
            )}

            {/* Profile info */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 className="text-2xl font-bold text-white">
                {currentCard.profile.name}, {currentCard.profile.age}
              </h2>
              {/* Occupation + Student badge */}
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm text-white/80">
                  {currentCard.profile.occupation}
                  {currentCard.profile.university && ` @ ${currentCard.profile.university}`}
                </p>
                {currentCard.profile.is_student && (
                  <span className="rounded-full bg-blue-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                    STUDENT
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-white/70">
                {currentCard.profile.postcode} • £{currentCard.profile.budget_min}–{currentCard.profile.budget_max}/mo
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                {currentCard.profile.bio}
              </p>

              {/* Match percentage tag */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className={`glass-dark rounded-full px-2.5 py-1 text-xs font-semibold ${matchColor(currentCard.matchPercentage)}`}>
                  {currentCard.matchPercentage}% match
                </span>
              </div>

              {/* View Profile link */}
              <a
                href={`/profile/${currentCard.profile.id}`}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                View Full Profile and AI Match
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Swipe overlays */}
            <div
              className="swipe-overlay border-4 border-like bg-like-bg"
              style={{ opacity: likeOpacity }}
            >
              <span className="rotate-[-15deg] text-5xl font-black text-like">LIKE</span>
            </div>
            <div
              className="swipe-overlay border-4 border-pass bg-pass-bg"
              style={{ opacity: passOpacity }}
            >
              <span className="rotate-[15deg] text-5xl font-black text-pass">NOPE</span>
            </div>
            <div
              className="swipe-overlay border-4 border-superlike bg-superlike-bg"
              style={{ opacity: superlikeOpacity }}
            >
              <span className="text-5xl font-black text-superlike">SUPER</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (always visible — essential for desktop) */}
      <div className="flex items-center justify-center gap-4 bg-surface px-4 py-3">
        <button
          onClick={() => performAction("pass")}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-pass bg-white shadow-md transition-all hover:bg-pass-bg hover:shadow-lg active:scale-90"
          aria-label="Pass"
        >
          <svg className="h-7 w-7 text-pass" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={() => performAction("superlike")}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-superlike bg-white shadow-md transition-all hover:bg-superlike-bg hover:shadow-lg active:scale-90"
          aria-label="Superlike"
        >
          <svg className="h-5 w-5 text-superlike" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
        <button
          onClick={() => performAction("like")}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-like bg-white shadow-md transition-all hover:bg-like-bg hover:shadow-lg active:scale-90"
          aria-label="Like"
        >
          <svg className="h-7 w-7 text-like" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
