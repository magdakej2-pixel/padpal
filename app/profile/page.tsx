"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { usePushNotifications } from "@/lib/use-push";
import { usePremium } from "@/lib/use-premium";
import BottomNav from "@/components/BottomNav";

interface UserProfileData {
  name: string;
  age: number;
  bio: string;
  location: string;
  budget_min: number;
  budget_max: number;
  looking_for: string;
  photos?: string[];
}

interface Listing {
  id: string;
  type: string;
  title: string;
  postcode: string;
  rent_pcm: number;
  created_at: string;
  photos: string[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ email?: string; metadata?: Record<string, unknown> } | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const pushNotifications = usePushNotifications();
  const premiumStatus = usePremium();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/verify");
        return;
      }
      setUser({ email: authUser.email, metadata: authUser.user_metadata });
      const profileData = authUser.user_metadata?.profile as UserProfileData | undefined;
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch user's own listings
      const { data: listings } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

      if (listings) {
        setMyListings(listings);
      }

      setLoading(false);
    };
    loadProfile();
  }, [supabase.auth, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This will permanently remove all your data, listings, matches, and messages. This cannot be undone."
    );
    if (!confirmed) return;
    const confirm2 = confirm("This is irreversible. Type OK to confirm.");
    if (!confirm2) return;

    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || "Failed to delete account. Please try again.");
        return;
      }

      // Sign out locally and redirect
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error("Delete account error:", err);
      alert("Something went wrong. Please try again or contact support.");
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    setDeletingId(listingId);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await supabase.from("listings").delete().eq("id", listingId).eq("user_id", authUser.id);
    }
    setMyListings((prev) => prev.filter((l) => l.id !== listingId));
    setDeletingId(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${authUser.id}/profile_${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, { upsert: true });

      if (!error) {
        const { data: urlData } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(filePath);

        const newPhotoUrl = urlData.publicUrl;
        const currentProfile = authUser.user_metadata?.profile || {};
        const existingPhotos = (currentProfile as Record<string, unknown>).photos as string[] || [];

        await supabase.auth.updateUser({
          data: {
            profile: {
              ...currentProfile,
              photos: [newPhotoUrl, ...existingPhotos],
            },
          },
        });

        setProfile((prev) => prev ? { ...prev, photos: [newPhotoUrl, ...(prev.photos || [])] } : prev);
      }
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 14" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white px-4 pb-4 pt-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dark">My Profile</h1>
          <button
            onClick={handleSignOut}
            className="rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-sm font-medium text-dark-secondary transition-colors hover:bg-surface"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Profile Card */}
        <div className="overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-sm">
          <div className="flex items-center gap-4 p-5">
            <div
              className="relative h-16 w-16 cursor-pointer group"
              onClick={() => photoInputRef.current?.click()}
            >
              <div className="h-full w-full overflow-hidden rounded-full bg-primary">
                {(profile?.photos?.[0] || (user?.metadata?.avatar_url as string)) ? (
                  <img
                    src={profile?.photos?.[0] || (user?.metadata?.avatar_url as string)}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                {!(profile?.photos?.[0] || (user?.metadata?.avatar_url as string)) && (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                    {profile?.name ? profile.name[0].toUpperCase() : user?.email?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              {/* Camera overlay */}
              <div className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-md ring-2 ring-white">
                {uploadingPhoto ? (
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 14" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-dark">
                {profile?.name || "Profile not set"}
                {profile?.age ? `, ${profile.age}` : ""}
              </h2>
              <p className="text-sm text-dark-secondary">{user?.email}</p>
              {profile?.location && (
                <p className="mt-0.5 text-sm text-muted">📍 {profile.location}</p>
              )}
            </div>
          </div>
          {profile && (
            <div className="border-t border-border px-5 py-3 flex items-center justify-between">
              <button
                onClick={() => router.push("/profile/create?edit=true")}
                className="text-sm font-semibold text-primary"
              >
                Edit Profile
              </button>
              <Link
                href="/boost?type=profile"
                className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.95]"
              >
                Boost Profile
              </Link>
            </div>
          )}
        </div>

        {!profile && (
          <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] bg-white py-12 px-6 text-center shadow-sm">
            <div className="mb-2 text-sm font-medium text-dark-secondary">Complete your profile</div>
            <h3 className="mb-1 text-lg font-bold text-dark">Complete your profile</h3>
            <p className="mb-4 text-sm text-dark-secondary">Add your details to start matching with flatmates</p>
            <button
              onClick={() => router.push("/profile/create")}
              className="rounded-[var(--radius-lg)] bg-primary px-6 py-3 font-semibold text-white shadow-sm"
            >
              Set Up Profile
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* MY LISTINGS */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="rounded-[var(--radius-lg)] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">My Listings</h3>
            <Link
              href="/listings/create"
              className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white"
            >
              + New
            </Link>
          </div>

          {myListings.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="mb-2 text-3xl">📋</div>
              <p className="text-sm text-dark-secondary">You haven&apos;t posted any listings yet</p>
              <Link
                href="/listings/create"
                className="mt-3 inline-block text-sm font-semibold text-primary"
              >
                Create your first listing →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {myListings.map((listing) => (
                <div key={listing.id} className="flex items-center gap-3 px-5 py-4">
                  {/* Thumbnail */}
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-surface">
                    {listing.photos?.[0] ? (
                      <img src={listing.photos[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl">
                        {listing.type === "offering" ? "🏠" : "🔍"}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark truncate">{listing.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold uppercase ${
                        listing.type === "offering" ? "text-success" : "text-blue-500"
                      }`}>
                        {listing.type === "offering" ? "Offering" : "Seeking"}
                      </span>
                      {listing.postcode && (
                        <span className="text-xs text-muted">📍 {listing.postcode}</span>
                      )}
                      {listing.rent_pcm > 0 && (
                        <span className="text-xs text-muted">£{listing.rent_pcm}/mo</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      href="/boost?type=listing"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface"
                      title="Boost"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                      </svg>
                    </Link>
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-primary-bg"
                      title="Edit"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </Link>
                    <Link
                      href={`/listings/${listing.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface"
                      title="View"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      disabled={deletingId === listing.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-red-400 hover:bg-red-50"
                      title="Delete"
                    >
                      {deletingId === listing.id ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 14" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SUBSCRIPTION */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="rounded-[var(--radius-lg)] bg-white shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">Subscription</h3>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark">Current Plan</p>
                <p className="text-xs text-muted mt-0.5">
                  {premiumStatus.loading ? "Checking..." : premiumStatus.isPremium ? "Premium ✨" : "Free"}
                </p>
              </div>
              {!premiumStatus.isPremium && (
                <Link
                  href="/premium"
                  className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-xs font-bold text-white"
                >
                  Upgrade
                </Link>
              )}
            </div>
            {!premiumStatus.isPremium && (
              <div className="mt-3 rounded-[var(--radius-md)] bg-surface p-3">
                <p className="text-xs text-dark-secondary mb-1 font-medium">Free plan includes:</p>
                <ul className="text-xs text-muted space-y-0.5">
                  <li>• See matches</li>
                  <li>• Up to 3 listings</li>
                  <li>• Basic chat</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SETTINGS — collapsible */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="rounded-[var(--radius-lg)] bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-semibold text-dark">Settings</span>
            </div>
            <svg className={`h-4 w-4 text-muted transition-transform ${showSettings ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          {showSettings && (
            <div className="divide-y divide-border border-t border-border animate-fade-in-up">
              <button
                onClick={async () => {
                  if (pushNotifications.isSubscribed) {
                    await pushNotifications.unsubscribe();
                  } else {
                    await pushNotifications.subscribe();
                  }
                }}
                disabled={pushNotifications.isLoading || !pushNotifications.isSupported}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  <span className="text-sm font-medium text-dark">Notifications</span>
                </div>
                <div className={`relative h-6 w-11 rounded-full transition-colors ${
                  pushNotifications.isSubscribed ? "bg-primary" : "bg-border"
                }`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    pushNotifications.isSubscribed ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                </div>
              </button>
              <Link href="/privacy" className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <span className="text-sm font-medium text-dark">Privacy</span>
                </div>
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
              <div className="flex w-full items-center justify-between px-5 py-4 text-left">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                  <span className="text-sm font-medium text-dark">Appearance</span>
                </div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wide">Coming soon</span>
              </div>
              <div className="flex w-full items-center justify-between px-5 py-4 text-left">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  <span className="text-sm font-medium text-dark">Language</span>
                </div>
                <span className="text-xs text-muted">English</span>
              </div>
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* LEGAL — collapsible */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="rounded-[var(--radius-lg)] bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setShowLegal(!showLegal)}
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-sm font-semibold text-dark">Legal Information</span>
            </div>
            <svg className={`h-4 w-4 text-muted transition-transform ${showLegal ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          {showLegal && (
            <div className="divide-y divide-border border-t border-border animate-fade-in-up">
              <Link href="/terms" className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="text-sm font-medium text-dark">Terms of Service</span>
                </div>
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
              <Link href="/privacy" className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <span className="text-sm font-medium text-dark">Privacy Policy</span>
                </div>
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
              <Link href="/privacy" className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                  <span className="text-sm font-medium text-dark">Cookie Policy</span>
                </div>
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
              <a href="mailto:support@padpal.co.uk" className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span className="text-sm font-medium text-dark">Contact Support</span>
                </div>
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* App Version */}
        <p className="pb-2 text-center text-xs text-muted">PadPal v1.0.0</p>
        <button
          onClick={handleDeleteAccount}
          className="mx-auto mb-4 block text-[11px] text-muted/50 underline transition-colors hover:text-red-400"
        >
          Delete Account
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
