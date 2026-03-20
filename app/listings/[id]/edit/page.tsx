"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
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

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);

  useEffect(() => {
    async function loadListing() {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        router.push("/profile");
        return;
      }

      setTitle(data.title || "");
      setDescription(data.description || "");
      setPostcode(data.postcode || "");
      setRent(data.rent_pcm?.toString() || "");
      setDeposit(data.deposit?.toString() || "");
      setRoomType(data.room_type || "");
      setBillsIncluded(data.bills_included || false);
      setAvailableFrom(data.available_from || "");
      setMinStay(data.min_stay?.toString() || "6");
      setAmenities(data.amenities || []);
      setPhotos(data.photos || []);
      setLoading(false);
    }
    loadListing();
  }, [id]);

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      setNewPhotoFiles((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onload = () => {
        setNewPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingPhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload new photos
      const uploadedUrls: string[] = [];
      for (let i = 0; i < newPhotoFiles.length; i++) {
        const file = newPhotoFiles[i];
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

      const allPhotos = [...photos, ...uploadedUrls];

      await supabase.from("listings").update({
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
        photos: allPhotos,
        updated_at: new Date().toISOString(),
      }).eq("id", id);

      router.push("/profile");
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 14" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <Link href="/profile" className="text-sm font-medium text-dark-secondary">← Cancel</Link>
        <h1 className="text-lg font-bold text-dark">Edit Listing</h1>
        <div className="w-14" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-dark">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-dark focus:border-primary focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-dark">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-dark focus:border-primary focus:outline-none resize-none"
          />
        </div>

        {/* Postcode + Rent */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-dark">Postcode</label>
            <input
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              className="h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-dark focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-dark">Rent £/mo</label>
            <input
              type="number"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              className="h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-dark focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Room type */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-dark">Room Type</label>
          <div className="grid grid-cols-4 gap-2">
            {ROOM_TYPES.map((rt) => (
              <button
                key={rt.value}
                onClick={() => setRoomType(rt.value)}
                className={`rounded-[var(--radius-md)] border p-3 text-center text-xs font-medium transition-all ${
                  roomType === rt.value
                    ? "border-primary bg-primary-bg text-primary"
                    : "border-border text-dark-secondary hover:border-primary/30"
                }`}
              >
                <div className="text-base mb-0.5">{rt.icon}</div>
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bills + Available from */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-dark">Available from</label>
            <input
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              className="h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-dark focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={billsIncluded}
                onChange={(e) => setBillsIncluded(e.target.checked)}
                className="h-5 w-5 rounded accent-primary"
              />
              <span className="text-sm font-medium text-dark">Bills included</span>
            </label>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-dark">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <button
                key={a}
                onClick={() => toggleAmenity(a)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  amenities.includes(a)
                    ? "border-primary bg-primary text-white"
                    : "border-border text-dark-secondary"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-dark">Photos</label>

          {/* Existing photos */}
          <div className="flex flex-wrap gap-2 mb-2">
            {photos.map((url, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-[var(--radius-md)]">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => removeExistingPhoto(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
            {newPhotoPreviews.map((url, i) => (
              <div key={`new-${i}`} className="relative h-20 w-20 overflow-hidden rounded-[var(--radius-md)] ring-2 ring-primary">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => removeNewPhoto(i)}
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

      {/* Save button */}
      <div className="border-t border-border px-5 py-4">
        <button
          onClick={handleSave}
          disabled={saving || !title}
          className="flex h-12 w-full items-center justify-center rounded-[var(--radius-lg)] bg-primary font-semibold text-white shadow-[var(--shadow-button)] disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Changes ✓"}
        </button>
      </div>
    </div>
  );
}
