"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const SOURCE_OPTIONS = [
  { value: "facebook", label: "Facebook Marketplace", icon: "📘" },
  { value: "gumtree", label: "Gumtree", icon: "🌳" },
  { value: "rightmove", label: "Rightmove", icon: "🏡" },
  { value: "zoopla", label: "Zoopla", icon: "🔍" },
  { value: "spareroom", label: "SpareRoom", icon: "🛏️" },
  { value: "other", label: "Other", icon: "🔗" },
];

export default function AddFoundPropertyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center"><p>Loading...</p></div>}>
      <AddFoundPropertyForm />
    </Suspense>
  );
}

function AddFoundPropertyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("from") || "/home";
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const FREE_LIMIT = 3;
  const [saving, setSaving] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [source, setSource] = useState("");
  const [title, setTitle] = useState("");
  const [rent, setRent] = useState("");
  const [postcode, setPostcode] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [listingCount, setListingCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  // Check listing count on mount
  useState(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("source", "user_found");
        setListingCount(count || 0);
        if ((count || 0) >= FREE_LIMIT) {
          setShowPaywall(true);
        }
      }
    })();
  });

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      setPhotoFiles((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (i: number) => {
    setPhotoFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPhotoPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!title || !postcode) return;

    // Check limit before submitting
    if (listingCount >= FREE_LIMIT) {
      setShowPaywall(true);
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload photos
      const uploadedUrls: string[] = [];
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const ext = file.name.split(".").pop() || "jpg";
        const filePath = `${user.id}/found_${Date.now()}_${i}.${ext}`;

        const { error } = await supabase.storage
          .from("listing-photos")
          .upload(filePath, file, { upsert: true });

        if (!error) {
          const { data: urlData } = supabase.storage
            .from("listing-photos")
            .getPublicUrl(filePath);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      await supabase.from("listings").insert({
        user_id: user.id,
        type: "offering",
        source: "user_found",
        external_url: externalUrl || null,
        external_source: source || null,
        title,
        description: notes || null,
        postcode,
        rent_pcm: rent ? parseInt(rent) : null,
        photos: uploadedUrls,
        room_type: "double",
        bills_included: false,
        available_from: new Date().toISOString().split("T")[0],
        min_stay: 6,
        amenities: [],
      });

      router.push(returnTo);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Soft paywall modal
  if (showPaywall) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-white to-surface px-6 safe-top safe-bottom">
        <div className="animate-fade-in-up w-full max-w-sm text-center">
          <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10"><svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
          <h1 className="mb-2 text-2xl font-bold text-dark">
            You&apos;ve reached your free limit
          </h1>
          <p className="mb-2 text-sm text-dark-secondary">
            Free users can add up to <strong>{FREE_LIMIT} properties</strong> from external sources.
          </p>
          <p className="mb-6 text-sm text-muted">
            You&apos;ve added {listingCount} of {FREE_LIMIT} free properties.
          </p>

          <div className="mb-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-left">
            <p className="mb-2 text-xs font-semibold text-dark-secondary uppercase tracking-wide">Premium includes</p>
            <div className="space-y-1.5">
              {["Unlimited property adds", "Search Together mode", "Shared board comments", "Real-time notifications", "Better AI matching"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <span className="text-primary text-xs">✓</span>
                  <span className="text-xs text-dark-secondary">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/premium"
            className="mb-3 flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-primary font-bold text-white shadow-lg"
          >
            Upgrade to Premium
          </Link>
          <Link
            href={returnTo}
            className="block text-sm text-muted hover:text-dark-secondary"
          >
            Maybe later
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <Link href={returnTo} className="text-sm font-medium text-dark-secondary">← Cancel</Link>
        <h1 className="text-lg font-bold text-dark">Add Property Found</h1>
        <div className="w-14" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Info banner */}
        <div className="rounded-[var(--radius-lg)] bg-gradient-to-r from-blue-50 to-primary-bg p-4">
          <p className="text-sm font-medium text-primary">
            🔗 Found a property on another site? Add it here so you and your roommate can review it together!
          </p>
        </div>

        {/* Source */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-dark">Where did you find it?</label>
          <div className="grid grid-cols-3 gap-2">
            {SOURCE_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSource(s.value)}
                className={`rounded-[var(--radius-md)] border p-2.5 text-center text-xs font-medium transition-all ${
                  source === s.value
                    ? "border-primary bg-primary-bg text-primary"
                    : "border-border text-dark-secondary"
                }`}
              >
                <div className="text-lg mb-0.5">{s.icon}</div>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* External URL */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-dark">Link to listing (optional)</label>
          <input
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://facebook.com/marketplace/..."
            className="h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-dark focus:border-primary focus:outline-none"
          />
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-dark">Title / Description</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Bright double room in Hackney"
            className="h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-dark focus:border-primary focus:outline-none"
          />
        </div>

        {/* Price + Postcode */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-dark">Rent £/mo</label>
            <input
              type="number"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              placeholder="850"
              className="h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-dark focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-dark">Postcode</label>
            <input
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="E8"
              className="h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-dark focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-dark">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any notes about this property..."
            className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-dark focus:border-primary focus:outline-none resize-none"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-dark">Photos</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {photoPreviews.map((url, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-[var(--radius-md)]">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotoAdd} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-[var(--radius-md)] border border-dashed border-border px-4 py-2 text-sm font-medium text-dark-secondary"
          >
            + Add Photos
          </button>
        </div>
      </div>

      {/* Submit */}
      <div className="border-t border-border px-5 py-4">
        <button
          onClick={handleSubmit}
          disabled={saving || !title || !postcode}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-primary font-semibold text-white shadow-[var(--shadow-button)] disabled:opacity-40"
        >
          {saving ? "Saving..." : "🔗 Add Property"}
        </button>
      </div>
    </div>
  );
}
