"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { calculateMatch } from "@/lib/matching";
import { UserPreferences } from "@/types";
import BottomNav from "@/components/BottomNav";

interface PartnerData {
  name: string;
  photo?: string;
  age?: number;
  budget_min?: number;
  budget_max?: number;
  location?: string;
}

export default function SearchTogetherPage() {
  const [myName, setMyName] = useState("");
  const [myPhoto, setMyPhoto] = useState<string | undefined>();
  const [myBudgetMin, setMyBudgetMin] = useState(500);
  const [myBudgetMax, setMyBudgetMax] = useState(1000);
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [matchScore, setMatchScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noMatch, setNoMatch] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); setNoMatch(true); return; }

      // Load current user's profile
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("name, photos, budget_min, budget_max, location")
        .eq("user_id", user.id)
        .single();

      if (myProfile) {
        setMyName(myProfile.name || user.email?.split("@")[0] || "You");
        setMyPhoto((myProfile.photos as string[])?.[0]);
        setMyBudgetMin(myProfile.budget_min || 500);
        setMyBudgetMax(myProfile.budget_max || 1000);
      } else {
        const name = user.user_metadata?.profile?.name || user.email?.split("@")[0] || "You";
        setMyName(name);
      }

      // Find most recent match (conversation partner)
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!convs || convs.length === 0) {
        setLoading(false);
        setNoMatch(true);
        return;
      }

      const conv = convs[0] as Record<string, unknown>;
      const partnerId = (conv.user1_id as string) === user.id
        ? (conv.user2_id as string)
        : (conv.user1_id as string);

      // Load partner's profile
      const { data: partnerProfile } = await supabase
        .from("profiles")
        .select("name, photos, age, budget_min, budget_max, location")
        .eq("user_id", partnerId)
        .single();

      if (partnerProfile) {
        setPartner({
          name: partnerProfile.name || "PadPal User",
          photo: (partnerProfile.photos as string[])?.[0],
          age: partnerProfile.age,
          budget_min: partnerProfile.budget_min,
          budget_max: partnerProfile.budget_max,
          location: partnerProfile.location,
        });
      }

      // Calculate match score from quiz answers
      const { data: myQuiz } = await supabase
        .from("quiz_answers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: partnerQuiz } = await supabase
        .from("quiz_answers")
        .select("*")
        .eq("user_id", partnerId)
        .single();

      const toPrefs = (q: Record<string, unknown> | null, uid: string): UserPreferences => ({
        user_id: uid,
        schedule: (q?.schedule as UserPreferences["schedule"]) || null,
        social: (q?.social as UserPreferences["social"]) || null,
        cleanliness: (q?.cleanliness as UserPreferences["cleanliness"]) || null,
        budget_range: (q?.budget_range as UserPreferences["budget_range"]) || null,
        hobbies: (q?.hobbies as string[]) || [],
        pets: (q?.pets as UserPreferences["pets"]) || null,
        is_student: (q?.is_student as boolean) || false,
      });

      const { percentage } = calculateMatch(
        toPrefs(myQuiz, user.id),
        toPrefs(partnerQuiz, partnerId)
      );
      setMatchScore(percentage);

      setLoading(false);
    }
    loadData();
  }, []);

  // Combined budget
  const combinedBudgetMin = myBudgetMin + (partner?.budget_min || 500);
  const combinedBudgetMax = myBudgetMax + (partner?.budget_max || 1000);
  const combinedBudget = `£${combinedBudgetMin.toLocaleString()} – £${combinedBudgetMax.toLocaleString()}/mo`;

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
      </div>
    );
  }

  if (noMatch || !partner) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface safe-top safe-bottom">
        <div className="bg-white px-5 pb-5 pt-6 shadow-sm">
          <Link href="/home" className="mb-3 inline-flex items-center gap-1 text-sm text-muted">
            ← Back to Home
          </Link>
          <h1 className="text-xl font-bold text-dark">Search Together</h1>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-3 text-5xl">👥</div>
          <h2 className="mb-2 text-xl font-bold text-dark">No match yet</h2>
          <p className="mb-6 text-sm text-dark-secondary max-w-[280px]">
            Match with a flatmate on the Discover page first, then come back to search for homes together!
          </p>
          <Link
            href="/discover"
            className="rounded-[var(--radius-lg)] bg-primary px-6 py-3 font-semibold text-white shadow-sm"
          >
            Discover Flatmates
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface safe-top safe-bottom">
      {/* Header */}
      <div className="bg-white px-5 pb-5 pt-6 shadow-sm">
        <Link href="/home" className="mb-3 inline-flex items-center gap-1 text-sm text-muted">
          ← Back to Home
        </Link>
        <h1 className="text-xl font-bold text-dark">Search Together</h1>
      </div>

      <div className="flex-1 px-5 py-5 space-y-4">
        {/* Duo card */}
        <div className="rounded-[var(--radius-xl)] bg-gradient-to-br from-primary to-primary-dark p-5 shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-3 border-white/50 shadow-md bg-white/20">
              {myPhoto ? (
                <Image src={myPhoto} alt={myName} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                  {myName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-sm font-bold">
              +
            </div>
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-3 border-white/50 shadow-md bg-white/20">
              {partner.photo ? (
                <Image src={partner.photo} alt={partner.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                  {partner.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <p className="text-center text-white font-semibold text-lg">
            {myName} & {partner.name}
          </p>
          <p className="text-center text-white/70 text-sm">
            {matchScore}% roommate compatibility
          </p>
        </div>

        {/* Combined preferences */}
        <div className="rounded-[var(--radius-lg)] bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-muted uppercase tracking-wide">Combined Preferences</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
                <span className="text-sm text-dark-secondary">Combined Budget</span>
              </div>
              <span className="text-sm font-semibold text-dark">{combinedBudget}</span>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="text-sm text-dark-secondary">Location</span>
              </div>
              <span className="text-sm font-semibold text-dark">
                {partner.location || "London"}
              </span>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span className="text-sm text-dark-secondary">Compatibility</span>
              </div>
              <span className={`text-sm font-semibold ${matchScore >= 70 ? "text-success" : matchScore >= 50 ? "text-warning" : "text-danger"}`}>
                {matchScore}% match
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/search-together/listings"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-primary font-semibold text-white shadow-[var(--shadow-button)] transition-all active:scale-[0.98]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Browse Homes Together
        </Link>

        {/* Add found property */}
        <Link
          href="/listings/add-found?from=/search-together"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-border bg-white font-medium text-dark-secondary transition-all active:scale-[0.98]"
        >
          Add Property You Found
        </Link>

        {/* Shared decisions shortcut */}
        <Link
          href="/search-together/decisions"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-border bg-white font-medium text-dark-secondary transition-all hover:border-primary/30"
        >
          View Shared Decisions
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
