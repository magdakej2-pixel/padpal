"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface MatchedProfile {
  name: string;
  photos: string[];
  occupation: string;
  age: number;
}

function MatchContent() {
  const searchParams = useSearchParams();
  const matchedUserId = searchParams.get("with");
  const matchPct = parseInt(searchParams.get("pct") || "0", 10);
  const [matchedProfile, setMatchedProfile] = useState<MatchedProfile | null>(null);
  const [myName, setMyName] = useState("You");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    async function loadMatch() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Load current user's name
      if (user) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .single();
        if (myProfile) setMyName(myProfile.name);
      }

      // Load matched user's profile
      if (matchedUserId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, photos, occupation, age")
          .eq("user_id", matchedUserId)
          .single();
        if (profile) setMatchedProfile(profile);
      }
    }
    loadMatch();
  }, [matchedUserId]);

  if (!matchedProfile) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-white to-pink-50 px-5 safe-top safe-bottom">
      <div className="animate-fade-in-up w-full max-w-sm">
        {/* Title */}
        <h1 className="mb-6 text-center text-3xl font-bold text-dark">
          It&apos;s a Match!
        </h1>

        {/* Photos */}
        <div className="relative mb-6 flex justify-center">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg -mr-4 z-10 bg-surface">
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted">
              {myName[0]}
            </div>
          </div>
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg -ml-4 bg-surface">
            {matchedProfile.photos?.[0] ? (
              <img
                src={matchedProfile.photos[0]}
                alt={matchedProfile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted">
                {matchedProfile.name[0]}
              </div>
            )}
          </div>
          {/* Heart */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>
        </div>

        {/* Names */}
        <p className="mb-1 text-center text-base text-dark-secondary">
          <span className="font-semibold text-dark">{myName}</span>
          {" & "}
          <span className="font-semibold text-dark">{matchedProfile.name}</span>
        </p>

        {/* Compatibility Score */}
        {matchPct > 0 && (
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-success/10 px-4 py-1.5">
              <span className="text-sm font-bold text-success">
                {matchPct}% Compatible
              </span>
            </div>
          </div>
        )}

        {/* Breakdown toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mb-4 w-full text-center text-sm font-medium text-primary"
        >
          {showDetails ? "Hide details" : "View compatibility breakdown"}
        </button>

        {showDetails && (
          <div className="mb-6 space-y-2 animate-fade-in-up">
            {[
              { label: "Cleanliness", score: Math.min(matchPct + 8, 100) },
              { label: "Schedule", score: Math.min(matchPct + 3, 100) },
              { label: "Budget", score: Math.max(matchPct - 2, 0) },
              { label: "Social", score: Math.max(matchPct - 7, 0) },
              { label: "Lifestyle", score: Math.max(matchPct - 5, 0) },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-[var(--radius-md)] bg-white p-3 shadow-sm">
                <span className="flex-1 text-sm font-medium text-dark">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-dark-secondary w-8">{item.score}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          <Link
            href="/chats"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-primary font-semibold text-white shadow-[var(--shadow-button)] transition-all active:scale-[0.98]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            Chat with {matchedProfile.name.split(" ")[0]}
          </Link>

          <Link
            href="/premium"
            className="relative flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-primary/30 bg-primary-bg font-semibold text-primary transition-all active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Start Searching Together
            <span className="absolute -top-2 -right-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
              PREMIUM
            </span>
          </Link>
        </div>

        {/* Skip */}
        <Link
          href="/discover"
          className="mt-4 block text-center text-sm text-muted hover:text-dark-secondary"
        >
          Keep swiping
        </Link>
      </div>
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
      </div>
    }>
      <MatchContent />
    </Suspense>
  );
}
