"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase";

interface ProfileData {
  name: string;
  age: string;
  bio: string;
  location: string;
  budget_min: string;
  budget_max: string;
  looking_for: "room" | "flatmate" | "both";
  is_student: "yes" | "no";
}

const UK_CITIES = [
  "London", "Manchester", "Birmingham", "Leeds", "Bristol",
  "Liverpool", "Edinburgh", "Glasgow", "Cardiff", "Belfast",
  "Nottingham", "Sheffield", "Brighton", "Oxford", "Cambridge",
];

import { Suspense } from "react";

export default function CreateProfilePageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" /></div>}>
      <CreateProfilePage />
    </Suspense>
  );
}

function CreateProfilePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    age: "",
    bio: "",
    location: "",
    budget_min: "600",
    budget_max: "900",
    looking_for: "both",
    is_student: "no",
  });
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("edit") === "true";
  const supabase = createClient();

  // Pre-populate if editing; redirect if creating and already has profile
  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.profile_completed) {
        if (!isEditing) {
          router.push("/discover");
          return;
        }
        // Pre-populate form with existing data
        const existingProfile = user.user_metadata.profile as Record<string, unknown>;
        if (existingProfile) {
          setProfile({
            name: (existingProfile.name as string) || "",
            age: String(existingProfile.age || ""),
            bio: (existingProfile.bio as string) || "",
            location: (existingProfile.location as string) || "",
            budget_min: String(existingProfile.budget_min || "600"),
            budget_max: String(existingProfile.budget_max || "900"),
            looking_for: (existingProfile.looking_for as "room" | "flatmate" | "both") || "both",
            is_student: ((existingProfile.is_student as string) === "yes" ? "yes" : "no") as "yes" | "no",
          });
          if (existingProfile.photos) {
            setPhotos(existingProfile.photos as string[]);
          }
        }
      }
    };
    checkProfile();
  }, [supabase.auth, router, isEditing]);

  // Photo handling — stores both preview (base64) and raw File for upload
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (photos.length >= 4) return;
      setPhotoFiles((prev) => [...prev.slice(0, 3), file]);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((prev) => [...prev.slice(0, 3), reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 1) return photos.length >= 1;
    if (step === 2) return profile.name && profile.age && profile.bio;
    if (step === 3) return profile.location;
    return false;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload photos to Supabase Storage
      const uploadedUrls: string[] = [];
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const ext = file.name.split(".").pop() || "jpg";
        const filePath = `${user.id}/photo_${i}_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("profile-photos")
            .getPublicUrl(filePath);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      // Keep existing photos that are URLs (not new uploads), plus new ones
      const existingUrlPhotos = photos.filter(p => p.startsWith('http'));
      const finalPhotos = [...existingUrlPhotos.filter(u => !uploadedUrls.some(nu => nu === u)), ...uploadedUrls];

      await supabase.auth.updateUser({
        data: {
          profile_completed: true,
          profile: {
            ...profile,
            photos: finalPhotos.length > 0 ? finalPhotos : uploadedUrls,
            age: parseInt(profile.age),
            budget_min: parseInt(profile.budget_min),
            budget_max: parseInt(profile.budget_max),
          },
        },
      });

      // Also update the profiles table if it exists
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (refreshedUser) {
        await supabase.from("profiles").upsert({
          user_id: refreshedUser.id,
          name: profile.name,
          age: parseInt(profile.age),
          bio: profile.bio,
          location: profile.location,
          budget_min: parseInt(profile.budget_min),
          budget_max: parseInt(profile.budget_max),
          looking_for: profile.looking_for,
          is_student: profile.is_student === "yes",
          photos: finalPhotos.length > 0 ? finalPhotos : uploadedUrls,
        }, { onConflict: "user_id" });
      }

      router.push(isEditing ? "/profile" : "/listings/create?onboarding=true");
    } catch {
      router.push(isEditing ? "/profile" : "/listings/create?onboarding=true");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
    else handleSubmit();
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
    else router.back();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <button onClick={prevStep} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface" aria-label="Go back">
          <svg className="h-5 w-5 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-muted">Step {step} of 3</span>
        <div className="w-11" />
      </div>

      {/* Progress */}
      <div className="flex gap-1 px-4 pt-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className={`h-full rounded-full bg-primary transition-all duration-500 ${
                s <= step ? "w-full" : "w-0"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 pt-6">
        {/* ===== STEP 1: Photos ===== */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <h1 className="mb-2 text-2xl font-bold text-dark">Add your photos</h1>
            <p className="mb-6 text-sm text-dark-secondary">
              Add at least 1 photo. Profiles with 3+ photos get 5x more matches.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Photo slots */}
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="relative">
                  {photos[i] ? (
                    <div className="group relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)]">
                      <Image
                        src={photos[i]}
                        alt={`Photo ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-dark/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {i === 0 && (
                        <div className="absolute bottom-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                          MAIN
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className={`flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed transition-colors ${
                        i === 0
                          ? "border-primary bg-primary-bg hover:bg-primary-bg-hover"
                          : "border-border bg-surface hover:border-muted"
                      }`}
                    >
                      <svg
                        className={`h-8 w-8 ${i === 0 ? "text-primary" : "text-muted"}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span className={`text-xs font-medium ${i === 0 ? "text-primary" : "text-muted"}`}>
                        {i === 0 ? "Main Photo" : "Add"}
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoAdd}
            />
            <p className="mt-3 text-center text-xs text-muted">
              Tip: Use a clear face photo as your main picture
            </p>
          </div>
        )}

        {/* ===== STEP 2: Basic Info ===== */}
        {step === 2 && (
          <div className="animate-slide-in">
            <h1 className="mb-2 text-2xl font-bold text-dark">About you</h1>
            <p className="mb-6 text-sm text-dark-secondary">
              This helps flatmates get to know you better.
            </p>

            {/* Name */}
            <label className="mb-1 block text-sm font-medium text-dark">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Alex Johnson"
              value={profile.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="mb-4 h-12 w-full rounded-[var(--radius-md)] border-2 border-border bg-white px-4 text-base text-dark outline-none transition-colors focus:border-primary"
              autoFocus
            />

            {/* Age */}
            <label className="mb-1 block text-sm font-medium text-dark">Age</label>
            <input
              type="number"
              placeholder="25"
              min={18}
              max={99}
              value={profile.age}
              onChange={(e) => handleChange("age", e.target.value)}
              className="mb-4 h-12 w-full rounded-[var(--radius-md)] border-2 border-border bg-white px-4 text-base text-dark outline-none transition-colors focus:border-primary"
            />

            {/* Bio */}
            <label className="mb-1 block text-sm font-medium text-dark">
              Bio <span className="font-normal text-muted">(max 200 chars)</span>
            </label>
            <textarea
              placeholder="Tell potential flatmates about yourself..."
              value={profile.bio}
              onChange={(e) => handleChange("bio", e.target.value.slice(0, 200))}
              rows={3}
              className="mb-2 w-full resize-none rounded-[var(--radius-md)] border-2 border-border bg-white px-4 py-3 text-base text-dark outline-none transition-colors focus:border-primary"
            />
            <p className="mb-4 text-right text-xs text-muted">{profile.bio.length}/200</p>

            {/* Looking for */}
            <label className="mb-2 block text-sm font-medium text-dark">I&apos;m looking for</label>
            <div className="flex gap-2">
              {([
                { value: "room", label: "🏠 A Room" },
                { value: "flatmate", label: "👥 A Flatmate" },
                { value: "both", label: "🔄 Both" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChange("looking_for", opt.value)}
                  className={`flex-1 rounded-[var(--radius-md)] border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                    profile.looking_for === opt.value
                      ? "border-primary bg-primary-bg text-primary"
                      : "border-border text-dark-secondary hover:border-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Student status */}
            <label className="mb-2 mt-4 block text-sm font-medium text-dark">Are you a student?</label>
            <div className="flex gap-2">
              {([
                { value: "yes", label: "🎓 Yes" },
                { value: "no", label: "💼 No" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChange("is_student", opt.value)}
                  className={`flex-1 rounded-[var(--radius-md)] border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                    profile.is_student === opt.value
                      ? "border-primary bg-primary-bg text-primary"
                      : "border-border text-dark-secondary hover:border-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>


          </div>
        )}

        {/* ===== STEP 3: Location & Budget ===== */}
        {step === 3 && (
          <div className="animate-slide-in">
            <h1 className="mb-2 text-2xl font-bold text-dark">Where and Budget</h1>
            <p className="mb-6 text-sm text-dark-secondary">
              Help us find you matches in the right area and price range.
            </p>

            {/* Location */}
            <label className="mb-1 block text-sm font-medium text-dark">City / Area</label>
            <div className="relative mb-4">
              <select
                value={profile.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="h-12 w-full appearance-none rounded-[var(--radius-md)] border-2 border-border bg-white px-4 pr-10 text-base text-dark outline-none transition-colors focus:border-primary"
              >
                <option value="">Select your city</option>
                {UK_CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Budget Range */}
            <label className="mb-1 block text-sm font-medium text-dark">Monthly Budget (£)</label>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={profile.budget_min}
                  onChange={(e) => handleChange("budget_min", e.target.value)}
                  className="h-12 w-full rounded-[var(--radius-md)] border-2 border-border bg-white px-4 text-base text-dark outline-none transition-colors focus:border-primary"
                />
                <p className="mt-1 text-center text-xs text-muted">Min</p>
              </div>
              <span className="mt-[-16px] text-muted">—</span>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Max"
                  value={profile.budget_max}
                  onChange={(e) => handleChange("budget_max", e.target.value)}
                  className="h-12 w-full rounded-[var(--radius-md)] border-2 border-border bg-white px-4 text-base text-dark outline-none transition-colors focus:border-primary"
                />
                <p className="mt-1 text-center text-xs text-muted">Max</p>
              </div>
            </div>

            {/* Summary card */}
            <div className="rounded-[var(--radius-lg)] border-2 border-border bg-surface p-4">
              <p className="mb-2 text-sm font-semibold text-dark">Profile Preview</p>
              <div className="flex items-center gap-3">
                {photos[0] ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <Image src={photos[0]} alt="Profile" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-bg text-xl">
                    {profile.name ? profile.name[0].toUpperCase() : "?"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-dark">
                    {profile.name || "Your Name"}, {profile.age || "??"}
                  </p>
                  <p className="text-xs text-muted">
                    {profile.location || "City"} • £{profile.budget_min}–{profile.budget_max}/mo
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-6 pt-4">
        <button
          onClick={nextStep}
          disabled={!canProceed() || loading}
          className="flex h-14 w-full items-center justify-center rounded-[var(--radius-lg)] bg-primary text-base font-semibold text-white shadow-[var(--shadow-button)] transition-all duration-200 hover:bg-primary-dark active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 14" />
            </svg>
          ) : step === 3 ? (
            "Start Discovering 🏠"
          ) : (
            "Continue →"
          )}
        </button>
      </div>
    </div>
  );
}
