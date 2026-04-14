"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { RoomListing } from "@/types";
import BottomNav from "@/components/BottomNav";

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "offering", label: "Rooms Available" },
  { value: "seeking", label: "People Seeking" },
];

const ROOM_TYPES = ["single", "double", "ensuite", "studio"];

export default function ListingsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState(1500);
  const [showFilters, setShowFilters] = useState(false);
  const [allListings, setAllListings] = useState<RoomListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real listings from Supabase on mount
  useEffect(() => {
    async function fetchListings() {
      const supabase = createClient();
      // Fetch listings — RLS handles visibility filtering
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Listings fetch error:", error);
      }

      if (data) {
        const listings: RoomListing[] = data.map((row: Record<string, unknown>) => {
          return {
            id: row.id as string,
            user_id: row.user_id as string,
            type: row.type as "offering" | "seeking",
            title: row.title as string,
            description: (row.description as string) || "",
            location: (row.postcode as string) || "",
            postcode: (row.postcode as string) || "",
            rent_pcm: (row.rent_pcm as number) || 0,
            bills_included: (row.bills_included as boolean) || false,
            deposit: (row.deposit as number) || 0,
            room_type: ((row.room_type as string) || "double") as "single" | "double" | "ensuite" | "studio",
            available_from: (row.available_from as string) || new Date().toISOString().split("T")[0],
            min_stay_months: (row.min_stay as number) || 6,
            amenities: (row.amenities as string[]) || [],
            photos: (row.photos as string[])?.length > 0 ? (row.photos as string[]) : [],
            is_active: true,
            created_at: (row.created_at as string) || "",
            updated_at: (row.updated_at as string) || "",
            user_name: "PadPal User",
            user_photo: undefined,
            is_verified: true,
            is_student: false,
            occupation: "PadPal Member",
            university: undefined,
          };
        });
        setAllListings(listings);
      }
      setLoading(false);
    }
    fetchListings();
  }, []);

  const filtered = allListings.filter((l) => {
    if (typeFilter !== "all" && l.type !== typeFilter) return false;
    if (l.rent_pcm > maxPrice) return false;
    return true;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-surface safe-top safe-bottom">
      {/* Header — sticky */}
      <div className="sticky top-0 z-10 bg-white px-4 pb-3 pt-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dark">Listings</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/listings/create"
              className="flex items-center gap-1.5 rounded-[var(--radius-lg)] bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Post
            </Link>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${showFilters ? "bg-primary text-white" : "bg-surface text-dark-secondary"}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </button>
          </div>
        </div>

        {/* Type filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                typeFilter === f.value
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white text-dark-secondary border border-border hover:border-primary/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-3 rounded-[var(--radius-md)] border border-border bg-surface p-3 animate-fade-in-up">
            <label className="mb-1 block text-xs font-medium text-muted">Max rent/month</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={300}
                max={2000}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="h-1.5 flex-1 appearance-none rounded-full bg-border accent-primary"
              />
              <span className="w-16 text-right text-sm font-semibold text-dark">£{maxPrice}</span>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
      {/* Results count */}
      <div className="px-4 py-3">
        <p className="text-sm text-muted">{filtered.length} listings found</p>
      </div>

      {/* Listings Grid */}
      <div className="space-y-3 px-4 pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-dark-secondary">No listings match your filters</p>
            <p className="text-sm text-muted">Try adjusting your budget or listing type</p>
            <Link href="/listings/create" className="mt-4 rounded-[var(--radius-lg)] bg-primary px-6 py-3 text-sm font-semibold text-white">Post a Listing</Link>
          </div>
        ) : (
          filtered.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="group block overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-sm transition-all hover:shadow-md"
            >
              {/* Image */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface">
                {listing.photos[0] ? (
                  <img
                    src={listing.photos[0]}
                    alt={listing.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface text-muted">
                    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                  </div>
                )}
                {/* Type badge */}
                <div className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${
                  listing.type === "offering"
                    ? "bg-success text-white"
                    : "bg-primary text-white"
                }`}>
                  {listing.type === "offering" ? "Room Available" : "Seeking Room"}
                </div>
                {/* Price badge */}
                <div className="absolute right-3 top-3 rounded-full bg-dark/80 px-3 py-1 text-sm font-bold text-white">
                  £{listing.rent_pcm}/mo
                </div>
              </div>

              {/* Info */}
              <div className="p-3.5">
                <h3 className="mb-1 text-base font-semibold text-dark line-clamp-1">{listing.title}</h3>
                <p className="text-sm text-dark-secondary line-clamp-2">{listing.description}</p>

                {/* Meta */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-dark-secondary">
                    {listing.postcode}
                  </span>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-dark-secondary">
                    {listing.room_type}
                  </span>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-dark-secondary">
                    From {formatDate(listing.available_from)}
                  </span>
                  {listing.bills_included && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      Bills included
                    </span>
                  )}
                </div>

                {/* User */}
                <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full bg-surface">
                    {listing.user_photo ? (
                      <img
                        src={listing.user_photo}
                        alt={listing.user_name || "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted">
                        {(listing.user_name || "U")[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-dark">{listing.user_name}</p>
                      {listing.is_verified && (
                        <svg className="h-3.5 w-3.5 text-success" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {listing.is_student && (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          STUDENT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      {listing.occupation}
                      {listing.university && ` @ ${listing.university}`}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      </div>

      <BottomNav />
    </div>
  );
}
