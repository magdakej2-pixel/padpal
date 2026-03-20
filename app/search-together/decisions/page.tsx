"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

interface ListingCard {
  id: string;
  title: string;
  location: string;
  postcode: string;
  rent_pcm: number;
  photos: string[];
  room_type: string;
  bills_included: boolean;
  available_from: string;
}

export default function SharedDecisionsPage() {
  const [mutualListings, setMutualListings] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      // In MVP, mutual likes are tracked via local state in the SharedListingsPage.
      // For now, show empty state. When collaborative features are built,
      // this will query an interactions/shared_likes table.
      setMutualListings([]);
      setLoading(false);
    }
    fetchListings();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white px-5 pb-4 pt-6 shadow-sm">
        <Link href="/search-together" className="mb-2 inline-flex items-center gap-1 text-sm text-muted">
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-dark">✅ Shared Decisions</h1>
        <p className="text-sm text-muted">Homes you both loved</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {mutualListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 text-5xl">🏠</div>
            <h3 className="mb-1 text-lg font-bold text-dark">No mutual likes yet</h3>
            <p className="mb-4 text-sm text-dark-secondary max-w-[250px]">
              Browse homes together — when you both like the same place, it&apos;ll show up here!
            </p>
            <Link
              href="/search-together/listings"
              className="rounded-[var(--radius-lg)] bg-primary px-5 py-3 font-semibold text-white shadow-sm"
            >
              Start Browsing
            </Link>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="rounded-[var(--radius-lg)] bg-gradient-to-r from-success/10 to-success/5 p-4">
              <p className="text-sm font-semibold text-success">
                🎉 You both agree on {mutualListings.length} home{mutualListings.length > 1 ? "s" : ""}!
              </p>
            </div>

            {mutualListings.map((listing) => {
              const budgetFit = listing.rent_pcm <= 1200;
              const hasPhoto = listing.photos.length > 0 && listing.photos[0]?.startsWith("http");
              return (
                <div key={listing.id} className="overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-sm">
                  {/* Photo */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    {hasPhoto ? (
                      <img src={listing.photos[0]} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-muted">
                        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                      </div>
                    )}
                    <div className="absolute left-3 top-3 rounded-full bg-success px-3 py-1 text-xs font-bold text-white">
                      ✅ Both liked
                    </div>
                    <div className="absolute right-3 top-3 rounded-full bg-dark/80 px-3 py-1 text-sm font-bold text-white">
                      £{listing.rent_pcm}/mo
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-dark mb-1">{listing.title}</h3>
                    <p className="text-sm text-muted mb-3">📍 {listing.postcode}, {listing.location}</p>

                    {/* Budget fit */}
                    <div className={`mb-3 flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 ${
                      budgetFit ? "bg-success/10" : "bg-warning/10"
                    }`}>
                      <span className="text-sm">{budgetFit ? "✅" : "⚠️"}</span>
                      <span className={`text-xs font-medium ${budgetFit ? "text-success" : "text-warning"}`}>
                        {budgetFit ? "Within combined budget" : "Above combined budget"}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-dark-secondary">
                        🛏️ {listing.room_type}
                      </span>
                      {listing.bills_included && (
                        <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-success font-medium">
                          Bills included
                        </span>
                      )}
                      <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-dark-secondary">
                        📅 From {new Date(listing.available_from).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => alert("Message sent to the landlord! 📨")}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-primary font-semibold text-white shadow-[var(--shadow-button)] transition-all active:scale-[0.98]"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      Contact Landlord
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
