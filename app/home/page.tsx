"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { usePremium } from "@/lib/use-premium";
import BottomNav from "@/components/BottomNav";

export default function HomePage() {
  const [userName, setUserName] = useState("");
  const { isPremium } = usePremium();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.profile?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
        setUserName(name);
      }
    }
    loadUser();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-surface safe-top safe-bottom">
      {/* Header */}
      <div className="bg-white px-5 pb-5 pt-8 shadow-sm">
        <p className="text-sm text-muted mb-1">
          {userName ? `Welcome back, ${userName} 👋` : "Welcome to PadPal 👋"}
        </p>
        <h1 className="text-2xl font-bold text-dark">
          What are you looking for?
        </h1>
      </div>

      <div className="flex-1 px-5 py-6 space-y-5">
        {/* Find a Room */}
        <Link
          href="/listings"
          className="group relative block overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-primary to-[#D4680F] p-6 shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
          style={{ minHeight: "180px" }}
        >
          <div className="relative z-10">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Find a Room</h2>
            <p className="text-sm text-white/80 max-w-[200px]">
              Browse available rooms and find your perfect space
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 text-[120px] leading-none opacity-10">
            🏠
          </div>
          <svg className="absolute right-5 bottom-5 h-6 w-6 text-white/60 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>

        {/* Find a Roommate */}
        <Link
          href="/discover"
          className="group relative block overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-[#F9A825] to-[#E78F08] p-6 shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
          style={{ minHeight: "180px" }}
        >
          <div className="relative z-10">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Find a Roommate</h2>
            <p className="text-sm text-white/80 max-w-[200px]">
              Match with compatible flatmates based on lifestyle
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 text-[120px] leading-none opacity-10">
            👥
          </div>
          <svg className="absolute right-5 bottom-5 h-6 w-6 text-white/60 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/listings/create"
            className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-bg">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-dark">Post Listing</span>
          </Link>
          <Link
            href={isPremium ? "/listings/add-found?from=/home" : "/premium"}
            className="relative flex flex-col items-center gap-2 rounded-[var(--radius-lg)] bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-border">
              <svg className="h-5 w-5 text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.193-9.193a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-dark text-center">Add Found</span>
            {!isPremium && (
              <div className="absolute top-2 right-2">
                <svg className="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            )}
          </Link>
          <Link
            href="/chats"
            className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-bg">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-dark">Messages</span>
          </Link>
        </div>

        {/* Search Together */}
        <Link
          href={isPremium ? "/search-together" : "/premium"}
          className="group relative flex items-center gap-3 rounded-[var(--radius-lg)] bg-white p-4 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#D4680F] text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-dark">Search Together</span>
              {!isPremium && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">PREMIUM</span>
              )}
            </div>
            <p className="text-xs text-muted">Browse homes with your matched flatmate</p>
          </div>
          {!isPremium ? (
            <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
