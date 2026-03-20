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
  type: string;
  source?: string;
  external_source?: string;
}

export default function SharedListingsPage() {
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [partnerLikes] = useState<Set<string>>(new Set()); // Will be populated with real data when collaborative feature is built
  const [comments, setComments] = useState<Record<string, string>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchListings() {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("type", "offering")
        .order("created_at", { ascending: false });

      const dbListings: ListingCard[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        title: row.title as string,
        location: (row.postcode as string) || "",
        postcode: (row.postcode as string) || "",
        rent_pcm: (row.rent_pcm as number) || 0,
        photos: (row.photos as string[])?.length > 0 ? (row.photos as string[]) : [],
        room_type: (row.room_type as string) || "double",
        type: row.type as string,
        source: (row.source as string) || "landlord",
        external_source: (row.external_source as string) || undefined,
      }));

      setListings(dbListings);
      setLoading(false);
    }
    fetchListings();
  }, []);

  const handleLike = (id: string) => {
    setUserLikes((prev) => new Set(prev).add(id));
  };

  const handleSkip = (id: string) => {
    setSkipped((prev) => new Set(prev).add(id));
  };

  const handleComment = (id: string) => {
    if (!commentInput[id]?.trim()) return;
    setComments((prev) => ({ ...prev, [id]: commentInput[id] }));
    setCommentInput((prev) => ({ ...prev, [id]: "" }));
  };

  const visibleListings = listings.filter((l) => !skipped.has(l.id));
  const mutualLikes = visibleListings.filter((l) => userLikes.has(l.id) && partnerLikes.has(l.id));

  return (
    <div className="flex min-h-dvh flex-col bg-surface safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white px-5 pb-4 pt-6 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <Link href="/search-together" className="text-sm text-muted">← Back</Link>
          <div className="flex items-center gap-2">
            <Link
              href="/listings/add-found?from=/search-together/listings"
              className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-dark-secondary border border-border"
            >
              Add Found
            </Link>
            {mutualLikes.length > 0 && (
              <Link
                href="/search-together/decisions"
                className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success"
              >
                ✅ {mutualLikes.length} mutual
              </Link>
            )}
          </div>
        </div>
        <h1 className="text-xl font-bold text-dark">🏠 Browse Together</h1>
        <p className="text-sm text-muted">{visibleListings.length} homes available</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
          </div>
        ) : visibleListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-dark-secondary">No listings available yet</p>
            <p className="text-sm text-muted mt-1">Check back soon or post your own listing</p>
            <Link href="/listings/create" className="mt-4 rounded-[var(--radius-lg)] bg-primary px-5 py-3 font-semibold text-white shadow-sm">
              Post a Listing
            </Link>
          </div>
        ) : (
          visibleListings.map((listing) => {
            const isLiked = userLikes.has(listing.id);
            const partnerLiked = partnerLikes.has(listing.id);

            return (
              <div key={listing.id} className="overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-sm">
                {/* Photo */}
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  {listing.photos[0]?.startsWith("http") ? (
                    <img src={listing.photos[0]} alt={listing.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-muted">
                      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                    </div>
                  )}
                  <div className="absolute right-3 top-3 rounded-full bg-dark/80 px-3 py-1 text-sm font-bold text-white">
                    £{listing.rent_pcm}/mo
                  </div>
                  {isLiked && partnerLiked && (
                    <div className="absolute left-3 top-3 rounded-full bg-success px-3 py-1 text-xs font-bold text-white">
                      ✅ Both liked!
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    {listing.source === "user_found" ? (
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-dark-secondary border border-border">
                        {listing.external_source || "Found online"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-primary-bg px-2 py-0.5 text-[10px] font-bold text-primary">
                        Listing
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-dark mb-0.5">{listing.title}</h3>
                  <p className="text-sm text-muted mb-3">📍 {listing.postcode || listing.location} • {listing.room_type}</p>

                  {/* Partner status */}
                  {partnerLiked && !isLiked && (
                    <div className="mb-3 rounded-[var(--radius-md)] bg-pink-50 px-3 py-2 text-xs text-pink-600 font-medium">
                      💕 Your roommate liked this one!
                    </div>
                  )}

                  {/* Comments */}
                  {comments[listing.id] && (
                    <div className="mb-3 rounded-[var(--radius-md)] bg-primary-bg px-3 py-2 text-xs text-primary">
                      💬 You: {comments[listing.id]}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLike(listing.id)}
                      disabled={isLiked}
                      className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all ${
                        isLiked
                          ? "bg-success/10 text-success"
                          : "bg-surface text-dark-secondary hover:bg-success/10 hover:text-success"
                      }`}
                    >
                      👍 {isLiked ? "Liked" : "Like"}
                    </button>
                    <button
                      onClick={() => handleSkip(listing.id)}
                      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-surface text-sm font-semibold text-dark-secondary hover:bg-red-50 hover:text-red-400 transition-all"
                    >
                      👎 Skip
                    </button>
                    <button
                      onClick={() => {
                        const el = document.getElementById(`comment-${listing.id}`);
                        el?.classList.toggle("hidden");
                      }}
                      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-surface text-sm font-semibold text-dark-secondary hover:bg-primary-bg hover:text-primary transition-all"
                    >
                      💬 Comment
                    </button>
                  </div>

                  {/* Comment input */}
                  <div id={`comment-${listing.id}`} className="hidden mt-2 flex gap-2">
                    <input
                      value={commentInput[listing.id] || ""}
                      onChange={(e) => setCommentInput((prev) => ({ ...prev, [listing.id]: e.target.value }))}
                      placeholder="Add a comment..."
                      className="h-9 flex-1 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-dark focus:border-primary focus:outline-none"
                      onKeyDown={(e) => e.key === "Enter" && handleComment(listing.id)}
                    />
                    <button
                      onClick={() => handleComment(listing.id)}
                      className="rounded-[var(--radius-md)] bg-primary px-3 text-sm font-semibold text-white"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
