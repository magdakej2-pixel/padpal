"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { RoomListing } from "@/types";

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [listing, setListing] = useState<RoomListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchListing() {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Listing detail fetch error:", error);
      }

      if (data) {
        setListing({
          id: data.id,
          user_id: data.user_id,
          type: data.type,
          title: data.title,
          description: data.description || "",
          location: data.postcode || "",
          postcode: data.postcode || "",
          rent_pcm: data.rent_pcm || 0,
          bills_included: data.bills_included || false,
          deposit: data.deposit || 0,
          room_type: data.room_type || "double",
          available_from: data.available_from || new Date().toISOString().split("T")[0],
          min_stay_months: data.min_stay || 6,
          amenities: data.amenities || [],
          photos: data.photos?.length > 0 ? data.photos : [],
          is_active: true,
          created_at: data.created_at || "",
          updated_at: data.updated_at || "",
          user_name: "PadPal User",
          user_photo: undefined,
          user_age: 25,
          is_verified: true,
          is_student: false,
          occupation: "PadPal Member",
          university: undefined,
        });
      }
      setLoading(false);
    }
    fetchListing();
  }, [id]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-3 animate-spin rounded-full border-3 border-border border-t-primary" />
          <p className="text-dark-secondary">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-3 text-4xl">😕</div>
          <p className="text-dark-secondary">Listing not found</p>
          <Link href="/listings" className="mt-3 inline-block text-primary font-semibold">← Back to listings</Link>
        </div>
      </div>
    );
  }

  // Check if photo is external URL (Supabase storage) or local
  const hasPhoto = listing.photos.length > 0;
  const isExternalPhoto = hasPhoto && listing.photos[0]?.startsWith("http");

  return (
    <div className="min-h-dvh bg-white safe-top safe-bottom">
      {/* Hero Photo */}
      <div className="relative aspect-[16/10] w-full">
        {hasPhoto ? (
          isExternalPhoto ? (
            <img src={listing.photos[0]} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <Image src={listing.photos[0]} alt={listing.title} fill className="object-cover" priority />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-muted">
            <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

        {/* Back */}
        <Link href="/listings" className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Type badge */}
        <div className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold ${
          listing.type === "offering" ? "bg-success text-white" : "bg-primary text-white"
        }`}>
          {listing.type === "offering" ? "Room Available" : "Seeking Room"}
        </div>

        {/* Price */}
        <div className="absolute bottom-4 left-4">
          <p className="text-3xl font-bold text-white">£{listing.rent_pcm}<span className="text-lg font-normal">/mo</span></p>
          {listing.bills_included && (
            <p className="text-sm text-white/80">Bills included</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-5">
        <h1 className="mb-1 text-xl font-bold text-dark">{listing.title}</h1>
        <p className="mb-4 text-sm text-dark-secondary">📍 {listing.location}, {listing.postcode}</p>

        {/* Key details */}
        <div className="mb-5 grid grid-cols-2 gap-2">
          {[
            { icon: "🛏️", label: "Room type", value: listing.room_type.charAt(0).toUpperCase() + listing.room_type.slice(1) },
            { icon: "📅", label: "Available", value: formatDate(listing.available_from) },
            { icon: "📆", label: "Min stay", value: `${listing.min_stay_months} months` },
            { icon: "💰", label: "Deposit", value: `£${listing.deposit}` },
          ].map((item) => (
            <div key={item.label} className="rounded-[var(--radius-md)] bg-surface p-3">
              <p className="text-[11px] text-muted">{item.icon} {item.label}</p>
              <p className="text-sm font-semibold text-dark">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="mb-5">
          <h3 className="mb-2 text-base font-bold text-dark">Description</h3>
          <p className="text-sm leading-relaxed text-dark-secondary">{listing.description}</p>
        </div>

        {/* Amenities */}
        {listing.amenities.length > 0 && (
          <div className="mb-5">
            <h3 className="mb-3 text-base font-bold text-dark">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map((a) => (
                <span key={a} className="rounded-full bg-primary-bg px-3 py-1.5 text-sm font-medium text-primary">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Posted by */}
        <div className="rounded-[var(--radius-lg)] border border-border p-4">
          <p className="mb-2 text-xs text-muted">Posted by</p>
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-surface">
              {listing.user_photo ? (
                listing.user_photo.startsWith("http") ? (
                  <img src={listing.user_photo} alt={listing.user_name || "User"} className="h-full w-full object-cover" />
                ) : (
                  <Image
                    src={listing.user_photo}
                    alt={listing.user_name || "User"}
                    fill
                    className="object-cover"
                  />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted">
                  {(listing.user_name || "U")[0]}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-base font-semibold text-dark">{listing.user_name}</p>
                {listing.is_verified && (
                  <svg className="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-muted">{listing.occupation || "PadPal Member"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 flex gap-3 border-t border-border bg-white px-5 py-4 safe-bottom">
        <button className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border text-muted">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </button>
        <button
          disabled={contacting}
          onClick={async () => {
            if (!listing) return;
            setContacting(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) { router.push("/verify"); return; }
              if (user.id === listing.user_id) { alert("This is your own listing!"); setContacting(false); return; }

              // Sort IDs for consistent conversation lookup
              const ids = [user.id, listing.user_id].sort();

              // Check if conversation already exists
              const { data: existing } = await supabase
                .from("conversations")
                .select("id")
                .eq("user1_id", ids[0])
                .eq("user2_id", ids[1])
                .single();

              let conversationId: string;

              if (existing) {
                conversationId = existing.id;
              } else {
                // Create new conversation
                const { data: newConv } = await supabase
                  .from("conversations")
                  .insert({ user1_id: ids[0], user2_id: ids[1] })
                  .select("id")
                  .single();
                if (!newConv) { alert("Could not start conversation."); setContacting(false); return; }
                conversationId = newConv.id;

                // Send intro message
                const introMsg = `Hi! I'm interested in your listing: "${listing.title}" (£${listing.rent_pcm}/mo, ${listing.postcode})`;
                await supabase.from("messages").insert({
                  conversation_id: conversationId,
                  sender_id: user.id,
                  content: introMsg,
                });
                await supabase.from("conversations").update({
                  last_message: introMsg,
                  last_message_at: new Date().toISOString(),
                }).eq("id", conversationId);
              }

              router.push(`/chats/${conversationId}`);
            } catch (err) {
              console.error("Contact error:", err);
              alert("Something went wrong. Please try again.");
              setContacting(false);
            }
          }}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-primary font-semibold text-white shadow-[var(--shadow-button)] disabled:opacity-60"
        >
          {contacting ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 14" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          )}
          {contacting ? "Opening chat..." : `Message ${listing.user_name?.split(" ")[0]}`}
        </button>
      </div>
    </div>
  );
}
