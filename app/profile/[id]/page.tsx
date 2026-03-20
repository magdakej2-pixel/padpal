"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { calculateMatch, MatchBreakdown } from "@/lib/matching";
import { UserProfile, UserPreferences } from "@/types";

const CATEGORY_LABELS: Record<string, { label: string; icon: string; tip: string }> = {
  schedule: { label: "Schedule", icon: "🕐", tip: "When you wake up and sleep" },
  cleanliness: { label: "Cleanliness", icon: "✨", tip: "Tidiness standards" },
  social: { label: "Social", icon: "👥", tip: "How often you have guests" },
  budget: { label: "Budget", icon: "💷", tip: "Monthly rent range" },
  hobbies: { label: "Hobbies", icon: "🎯", tip: "Shared interests" },
  pets: { label: "Pets", icon: "🐾", tip: "Pet preferences" },
  student: { label: "Student", icon: "🎓", tip: "Student status match" },
};

const PREF_LABELS: Record<string, Record<string, string>> = {
  schedule: { early_bird: "Early Bird 🌅", regular: "Regular Hours ☀️", night_owl: "Night Owl 🌙" },
  social: { often: "Very Social 🎉", sometimes: "Balanced ⚖️", rarely: "Quiet & Private 📚" },
  cleanliness: { spotless: "Spotless ✨", tidy: "Tidy Enough 🧹", relaxed: "Relaxed 🛋️" },
  budget_range: { "400-600": "£400–600", "600-900": "£600–900", "900-1200": "£900–1,200", "1200+": "£1,200+" },
  pets: { love: "Loves All Pets 🐾", cats_ok: "Cats Only 🐱", no_pets: "No Pets 🚫", flexible: "Flexible 🤷" },
};

// SVG Radar Chart
function RadarChart({ breakdown }: { breakdown: Record<string, number> }) {
  const categories = Object.keys(breakdown);
  const n = categories.length;
  const cx = 100, cy = 100, r = 80;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const dist = (value / 100) * r;
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
    };
  };

  const gridCircles = [25, 50, 75, 100].map((pct) => {
    const points = categories.map((_, i) => {
      const p = getPoint(i, pct);
      return `${p.x},${p.y}`;
    });
    return points.join(" ");
  });

  const dataPoints = categories.map((cat, i) => {
    const p = getPoint(i, breakdown[cat]);
    return `${p.x},${p.y}`;
  });

  const axisLines = categories.map((_, i) => {
    const p = getPoint(i, 100);
    return { x1: cx, y1: cy, x2: p.x, y2: p.y };
  });

  const labels = categories.map((cat, i) => {
    const p = getPoint(i, 120);
    return { ...p, text: CATEGORY_LABELS[cat]?.label || cat, value: breakdown[cat] };
  });

  return (
    <svg viewBox="0 0 200 200" className="mx-auto h-52 w-52">
      {gridCircles.map((points, i) => (
        <polygon key={i} points={points} fill="none" stroke="var(--color-border)" strokeWidth="0.5" opacity={0.5} />
      ))}
      {axisLines.map((line, i) => (
        <line key={i} {...line} stroke="var(--color-border)" strokeWidth="0.5" opacity={0.3} />
      ))}
      <polygon points={dataPoints.join(" ")} fill="var(--color-primary)" fillOpacity="0.15" stroke="var(--color-primary)" strokeWidth="2" />
      {categories.map((cat, i) => {
        const p = getPoint(i, breakdown[cat]);
        return <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--color-primary)" />;
      })}
      {labels.map((label, i) => (
        <text key={i} x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="var(--color-dark-secondary)" fontWeight="600">
          {label.text}
        </text>
      ))}
    </svg>
  );
}

export default function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"about" | "match">("match");
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [matchData, setMatchData] = useState<{ percentage: number; breakdown: MatchBreakdown } | null>(null);

  useEffect(() => {
    async function fetchProfileData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch target profile
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", id)
        .single();

      if (!profileRow) {
        setLoading(false);
        return;
      }

      const targetProfile: UserProfile = {
        id: profileRow.user_id || profileRow.id,
        name: profileRow.name || "PadPal User",
        age: profileRow.age || 25,
        bio: profileRow.bio || "",
        location: profileRow.location || "London",
        postcode: profileRow.postcode || "",
        budget_min: profileRow.budget_min || 500,
        budget_max: profileRow.budget_max || 1000,
        looking_for: profileRow.looking_for || "both",
        photos: profileRow.photos || [],
        is_verified_email: true,
        is_verified_phone: false,
        is_student: profileRow.is_student || false,
        occupation: profileRow.occupation || "PadPal Member",
        university: profileRow.university || undefined,
        created_at: profileRow.created_at || "",
        updated_at: profileRow.updated_at || "",
      };
      setProfile(targetProfile);

      // Fetch target's quiz answers (preferences)
      const { data: targetQuiz } = await supabase
        .from("quiz_answers")
        .select("*")
        .eq("user_id", id)
        .single();

      const targetPrefs: UserPreferences = targetQuiz ? {
        user_id: id,
        schedule: targetQuiz.schedule || "regular",
        social: targetQuiz.social || "sometimes",
        cleanliness: targetQuiz.cleanliness || "tidy",
        budget_range: targetQuiz.budget_range || "600-900",
        hobbies: targetQuiz.hobbies || [],
        pets: targetQuiz.pets || "flexible",
        is_student: targetQuiz.is_student || false,
      } : {
        user_id: id,
        schedule: "regular",
        social: "sometimes",
        cleanliness: "tidy",
        budget_range: "600-900",
        hobbies: [],
        pets: "flexible",
      };
      setPrefs(targetPrefs);

      // Fetch current user's quiz answers for match calculation
      if (user) {
        const { data: myQuiz } = await supabase
          .from("quiz_answers")
          .select("*")
          .eq("user_id", user.id)
          .single();

        const myPrefs: UserPreferences = myQuiz ? {
          user_id: user.id,
          schedule: myQuiz.schedule || "regular",
          social: myQuiz.social || "sometimes",
          cleanliness: myQuiz.cleanliness || "tidy",
          budget_range: myQuiz.budget_range || "600-900",
          hobbies: myQuiz.hobbies || [],
          pets: myQuiz.pets || "flexible",
          is_student: myQuiz.is_student || false,
        } : {
          user_id: user.id,
          schedule: "regular",
          social: "sometimes",
          cleanliness: "tidy",
          budget_range: "600-900",
          hobbies: [],
          pets: "flexible",
        };

        const result = calculateMatch(myPrefs, targetPrefs);
        setMatchData(result);
      } else {
        // Not logged in — calculate with defaults
        const defaultPrefs: UserPreferences = {
          user_id: "anon",
          schedule: "regular",
          social: "sometimes",
          cleanliness: "tidy",
          budget_range: "600-900",
          hobbies: [],
          pets: "flexible",
        };
        const result = calculateMatch(defaultPrefs, targetPrefs);
        setMatchData(result);
      }

      setLoading(false);
    }
    fetchProfileData();
  }, [id]);

  const handleLike = () => {
    setLiked(true);
    setTimeout(() => {
      router.push("/discover");
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
      </div>
    );
  }

  if (!profile || !matchData || !prefs) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-3 text-4xl">😕</div>
          <p className="text-dark-secondary">Profile not found</p>
          <Link href="/discover" className="mt-3 inline-block text-primary font-semibold">← Back to discover</Link>
        </div>
      </div>
    );
  }

  const { percentage, breakdown } = matchData;
  const matchColor = percentage >= 80 ? "text-match-great" : percentage >= 60 ? "text-match-good" : "text-match-okay";

  // Determine photo source
  const hasPhoto = profile.photos.length > 0;
  const photoSrc = hasPhoto ? profile.photos[0] : undefined;
  const isExternalPhoto = photoSrc?.startsWith("http");

  return (
    <div className="min-h-dvh bg-white safe-top safe-bottom">
      {/* Hero Photo */}
      <div className="relative aspect-[4/5] w-full">
        {photoSrc ? (
          isExternalPhoto ? (
            <img src={photoSrc} alt={profile.name} className="h-full w-full object-cover" />
          ) : (
            <Image src={photoSrc} alt={profile.name} fill className="object-cover" priority />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-8xl font-bold text-primary/30">{profile.name[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Back button */}
        <Link href="/discover" className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Match badge */}
        <div className="absolute right-4 top-4 glass rounded-full px-3 py-1.5">
          <span className={`text-sm font-bold ${matchColor}`}>{percentage}% match</span>
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white">{profile.name}, {profile.age}</h1>
            {profile.is_verified_email && (
              <svg className="h-6 w-6 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="mt-1 text-sm text-white/80">📍 {profile.location}, {profile.postcode} • £{profile.budget_min}–{profile.budget_max}/mo</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("match")}
          className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === "match" ? "border-b-2 border-primary text-primary" : "text-dark-secondary"
          }`}
        >
          AI Match Breakdown
        </button>
        <button
          onClick={() => setActiveTab("about")}
          className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === "about" ? "border-b-2 border-primary text-primary" : "text-dark-secondary"
          }`}
        >
          About
        </button>
      </div>

      {/* Tab content */}
      <div className="px-5 py-5">
        {activeTab === "match" ? (
          <div className="animate-fade-in-up">
            {/* Radar Chart */}
            <div className="mb-5 rounded-[var(--radius-xl)] border border-border bg-surface p-4">
              <h3 className="mb-1 text-center text-base font-bold text-dark">Compatibility Radar</h3>
              <p className="mb-3 text-center text-xs text-muted">Based on your quiz answers</p>
              <RadarChart breakdown={breakdown as unknown as Record<string, number>} />
            </div>

            {/* Category details */}
            <div className="space-y-3">
              {Object.entries(breakdown).map(([key, value]) => {
                const cat = CATEGORY_LABELS[key];
                const barColor = value >= 80 ? "bg-match-great" : value >= 60 ? "bg-match-good" : value >= 40 ? "bg-match-okay" : "bg-match-low";
                return (
                  <div key={key} className="rounded-[var(--radius-md)] border border-border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat?.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-dark">{cat?.label}</p>
                          <p className="text-[11px] text-muted">{cat?.tip}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${value >= 80 ? "text-match-great" : value >= 60 ? "text-match-good" : "text-match-okay"}`}>
                        {value}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            {/* Bio */}
            <div className="mb-5">
              <h3 className="mb-2 text-base font-bold text-dark">Bio</h3>
              <p className="text-sm leading-relaxed text-dark-secondary">{profile.bio || "No bio yet."}</p>
            </div>

            {/* Lifestyle */}
            <div className="mb-5">
              <h3 className="mb-3 text-base font-bold text-dark">Lifestyle</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Schedule", value: PREF_LABELS.schedule?.[prefs.schedule ?? ""] ?? "—" },
                  { label: "Social", value: PREF_LABELS.social?.[prefs.social ?? ""] ?? "—" },
                  { label: "Cleanliness", value: PREF_LABELS.cleanliness?.[prefs.cleanliness ?? ""] ?? "—" },
                  { label: "Budget", value: PREF_LABELS.budget_range?.[prefs.budget_range ?? ""] ?? "—" },
                  { label: "Pets", value: PREF_LABELS.pets?.[prefs.pets ?? ""] ?? "—" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[var(--radius-md)] bg-surface p-3">
                    <p className="text-[11px] text-muted">{item.label}</p>
                    <p className="text-sm font-medium text-dark">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hobbies */}
            {prefs.hobbies && prefs.hobbies.length > 0 && (
              <div>
                <h3 className="mb-3 text-base font-bold text-dark">Hobbies</h3>
                <div className="flex flex-wrap gap-2">
                  {prefs.hobbies.map((hobby) => (
                    <span key={hobby} className="rounded-full bg-primary-bg px-3 py-1.5 text-sm font-medium text-primary">
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 border-t border-border bg-white px-5 py-4 safe-bottom">
        <button
          onClick={handleLike}
          disabled={liked}
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] font-semibold text-white shadow-[var(--shadow-button)] transition-all ${
            liked ? "bg-green-500 scale-95" : "bg-primary"
          }`}
        >
          {liked ? (
            <>
              <svg className="h-5 w-5 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              Liked! Finding more matches...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              Like {profile.name.split(" ")[0]}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
