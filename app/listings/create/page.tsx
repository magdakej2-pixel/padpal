"use client";

import { useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const ROOM_TYPES = [
  { value: "single", label: "Single", icon: "🛏️" },
  { value: "double", label: "Double", icon: "🛏️🛏️" },
  { value: "ensuite", label: "Ensuite", icon: "🚿" },
  { value: "studio", label: "Studio", icon: "🏠" },
];

const AMENITY_OPTIONS = [
  "WiFi", "Washing machine", "Dishwasher", "Garden", "Parking",
  "Balcony", "Ensuite bathroom", "Furnished", "Bike storage",
  "Near tube", "Pet-friendly", "Bills included",
];

function CreateListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [listingType, setListingType] = useState<"offering" | "seeking" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [postcode, setPostcode] = useState("");
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [roomType, setRoomType] = useState("");
  const [billsIncluded, setBillsIncluded] = useState(false);
  const [availableFrom, setAvailableFrom] = useState("");
  const [minStay, setMinStay] = useState("6");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (photos.length >= 6) return;
      setPhotoFiles((prev) => [...prev.slice(0, 5), file]);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((prev) => [...prev.slice(0, 5), reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const canProceed = () => {
    if (step === 1) return listingType !== null;
    if (step === 2) return title.trim() && description.trim() && postcode.trim();
    if (step === 3) return rent && roomType && availableFrom;
    return true;
  };

  const finishUrl = isOnboarding ? "/discover" : "/listings";

  return (
    <div className="flex min-h-dvh flex-col bg-white safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        {isOnboarding ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-bg text-lg">📋</div>
        ) : (
          <Link href="/listings" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface">
            <svg className="h-5 w-5 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <h1 className="flex-1 text-lg font-bold text-dark">
          {isOnboarding
            ? step === 1 ? "Post Your First Listing" : step === 2 ? "Details" : step === 3 ? "Pricing and Room" : "Amenities"
            : step === 1 ? "New Listing" : step === 2 ? "Details" : step === 3 ? "Pricing and Room" : "Amenities"
          }
        </h1>
        <span className="text-sm text-muted">Step {step}/4</span>
      </div>

      {/* Progress */}
      <div className="flex gap-1 px-4 pt-3">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {step === 1 && (
          <div className="animate-fade-in-up">
            <h2 className="mb-2 text-xl font-bold text-dark">
              {isOnboarding ? "Do you have a room or need one?" : "What type of listing?"}
            </h2>
            <p className="mb-6 text-sm text-dark-secondary">
              {isOnboarding
                ? "This helps us match you with the right people. You can always change this later."
                : "Choose whether you're offering a room or looking for one."
              }
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => setListingType("offering")}
                className={`flex w-full items-center gap-4 rounded-[var(--radius-lg)] border-2 p-4 text-left transition-all ${
                  listingType === "offering" ? "border-primary bg-primary-bg" : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-2xl">🏠</div>
                <div>
                  <p className="text-base font-semibold text-dark">I have a room</p>
                  <p className="text-sm text-dark-secondary">Post a room or flat for potential flatmates</p>
                </div>
              </button>
              <button
                onClick={() => setListingType("seeking")}
                className={`flex w-full items-center gap-4 rounded-[var(--radius-lg)] border-2 p-4 text-left transition-all ${
                  listingType === "seeking" ? "border-primary bg-primary-bg" : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-2xl">🔍</div>
                <div>
                  <p className="text-base font-semibold text-dark">I&apos;m looking for a room</p>
                  <p className="text-sm text-dark-secondary">Let landlords and flatmates know you&apos;re searching</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-up space-y-4">
            <h2 className="mb-1 text-xl font-bold text-dark">
              {listingType === "offering" ? "Describe your room" : "What are you looking for?"}
            </h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={listingType === "offering" ? "e.g. Bright double room in Shoreditch" : "e.g. Student looking for Zone 2 room"}
                className="h-12 w-full rounded-[var(--radius-md)] border border-border px-4 text-sm text-dark outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the room, flat, neighbourhood, and what makes it special..."
                rows={5}
                className="w-full rounded-[var(--radius-md)] border border-border px-4 py-3 text-sm text-dark outline-none transition-colors focus:border-primary resize-none"
              />
              <p className="mt-1 text-xs text-muted">{description.length}/500</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark">Postcode</label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                placeholder="e.g. E2, NW1, SE1"
                maxLength={4}
                className="h-12 w-full rounded-[var(--radius-md)] border border-border px-4 text-sm text-dark outline-none transition-colors focus:border-primary"
              />
            </div>

            {/* Photos */}
            <div>
              <label className="mb-2 block text-sm font-medium text-dark">Photos <span className="font-normal text-muted">(up to 6)</span></label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoAdd}
                className="hidden"
              />
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-border">
                    <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {photos.length < 6 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border-2 border-dashed border-border text-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    <span className="text-xs font-medium">Add Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in-up space-y-4">
            <h2 className="mb-1 text-xl font-bold text-dark">Pricing and Room</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-dark">Rent (£/month)</label>
                <input
                  type="number"
                  value={rent}
                  onChange={(e) => setRent(e.target.value)}
                  placeholder="850"
                  className="h-12 w-full rounded-[var(--radius-md)] border border-border px-4 text-sm text-dark outline-none transition-colors focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-dark">Deposit (£)</label>
                <input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  placeholder="850"
                  className="h-12 w-full rounded-[var(--radius-md)] border border-border px-4 text-sm text-dark outline-none transition-colors focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark">Room type</label>
              <div className="grid grid-cols-2 gap-2">
                {ROOM_TYPES.map((rt) => (
                  <button
                    key={rt.value}
                    onClick={() => setRoomType(rt.value)}
                    className={`rounded-[var(--radius-md)] border-2 p-3 text-left transition-all ${
                      roomType === rt.value ? "border-primary bg-primary-bg" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-lg">{rt.icon}</span>
                    <p className="mt-0.5 text-sm font-medium text-dark">{rt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border p-3">
              <span className="text-sm font-medium text-dark">Bills included?</span>
              <button
                onClick={() => setBillsIncluded(!billsIncluded)}
                className={`h-7 w-12 rounded-full transition-colors ${billsIncluded ? "bg-primary" : "bg-border"}`}
              >
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${billsIncluded ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-dark">Available from</label>
                <input
                  type="date"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  className="h-12 w-full rounded-[var(--radius-md)] border border-border px-4 text-sm text-dark outline-none transition-colors focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-dark">Min stay</label>
                <select
                  value={minStay}
                  onChange={(e) => setMinStay(e.target.value)}
                  className="h-12 w-full rounded-[var(--radius-md)] border border-border px-4 text-sm text-dark outline-none transition-colors focus:border-primary"
                >
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in-up">
            <h2 className="mb-1 text-xl font-bold text-dark">Amenities</h2>
            <p className="mb-4 text-sm text-dark-secondary">Select what&apos;s included or important to you.</p>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAmenity(a)}
                  className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-all ${
                    amenities.includes(a)
                      ? "border-primary bg-primary text-white"
                      : "border-border text-dark-secondary hover:border-primary/30"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 border-t border-border px-5 py-4">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex h-12 items-center justify-center rounded-[var(--radius-lg)] border-2 border-border px-6 font-semibold text-dark-secondary"
          >
            Back
          </button>
        )}
        {isOnboarding && step === 1 && (
          <button
            onClick={() => router.push("/discover")}
            className="flex h-12 items-center justify-center rounded-[var(--radius-lg)] border-2 border-border px-6 font-semibold text-dark-secondary"
          >
            Skip for now
          </button>
        )}
        <button
          onClick={async () => {
            if (step < 4) {
              setStep(step + 1);
            } else {
              // Upload photos to Supabase Storage and redirect
              setPublishing(true);
              try {
                const { data: { user } } = await supabase.auth.getUser();
                const uploadedUrls: string[] = [];

                if (user) {
                  for (let i = 0; i < photoFiles.length; i++) {
                    const file = photoFiles[i];
                    const ext = file.name.split(".").pop() || "jpg";
                    const filePath = `${user.id}/listing_${Date.now()}_${i}.${ext}`;

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

                  // Save listing to database
                  await supabase.from("listings").insert({
                    user_id: user.id,
                    type: listingType,
                    title,
                    description,
                    postcode,
                    rent_pcm: rent ? parseInt(rent) : null,
                    deposit: deposit ? parseInt(deposit) : null,
                    room_type: roomType,
                    bills_included: billsIncluded,
                    available_from: availableFrom || null,
                    min_stay: parseInt(minStay),
                    amenities,
                    photos: uploadedUrls,
                  });
                }
              } catch (err) {
                console.error("Publish error:", err);
              } finally {
                setPublishing(false);
              }
              window.location.href = finishUrl;
            }
          }}
          disabled={!canProceed() || publishing}
          className="flex h-12 flex-1 items-center justify-center rounded-[var(--radius-lg)] bg-primary font-semibold text-white shadow-[var(--shadow-button)] transition-all disabled:opacity-40 disabled:shadow-none"
        >
          {step < 4 ? "Continue →" : publishing ? "Publishing..." : isOnboarding ? "Publish and Start Matching 🎉" : "Publish Listing 🎉"}
        </button>
      </div>
    </div>
  );
}

export default function CreateListingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-dvh items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 14" />
        </svg>
      </div>
    }>
      <CreateListingContent />
    </Suspense>
  );
}
