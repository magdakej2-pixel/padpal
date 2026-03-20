import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getSupabaseAdmin } from "@/lib/supabase-server";
import { isRateLimited, getRateLimitKey } from "@/lib/security";
import { calculateMatch } from "@/lib/matching";
import { UserProfile, UserPreferences, MatchResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const { user, supabase } = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 15 match requests per minute
    const rlKey = getRateLimitKey(req, "matches");
    if (isRateLimited(rlKey, 15)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const userPrefs: UserPreferences = body.preferences;

    if (!userPrefs) {
      return NextResponse.json(
        { error: "Missing user preferences" },
        { status: 400 }
      );
    }

    // SECURITY: Force user_id from authenticated session
    userPrefs.user_id = user.id;

    // Use server-side supabase client (from getAuthUser)
    // Fetch all profiles except the requesting user
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .neq("user_id", userPrefs.user_id);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ matches: [], total: 0 });
    }

    // Fetch quiz answers for all matched profiles
    const profileUserIds = profiles.map((p: Record<string, unknown>) => p.user_id as string);
    const { data: quizAnswers } = await supabase
      .from("quiz_answers")
      .select("*")
      .in("user_id", profileUserIds);

    const quizMap: Record<string, UserPreferences> = {};
    (quizAnswers || []).forEach((q: Record<string, unknown>) => {
      quizMap[q.user_id as string] = {
        user_id: q.user_id as string,
        schedule: (q.schedule as UserPreferences["schedule"]) || null,
        social: (q.social as UserPreferences["social"]) || null,
        cleanliness: (q.cleanliness as UserPreferences["cleanliness"]) || null,
        budget_range: (q.budget_range as UserPreferences["budget_range"]) || null,
        hobbies: (q.hobbies as string[]) || [],
        pets: (q.pets as UserPreferences["pets"]) || null,
        is_student: (q.is_student as boolean) || false,
      };
    });

    // Calculate match for each real user
    const results: MatchResult[] = profiles
      .map((row: Record<string, unknown>) => {
        const profile: UserProfile = {
          id: (row.user_id as string) || (row.id as string),
          name: (row.name as string) || "PadPal User",
          age: (row.age as number) || 25,
          bio: (row.bio as string) || "",
          location: (row.location as string) || "London",
          postcode: (row.postcode as string) || "",
          budget_min: (row.budget_min as number) || 500,
          budget_max: (row.budget_max as number) || 1000,
          looking_for: (row.looking_for as UserProfile["looking_for"]) || "both",
          photos: (row.photos as string[]) || [],
          is_verified_email: true,
          is_verified_phone: false,
          is_student: (row.is_student as boolean) || false,
          occupation: (row.occupation as string) || "PadPal Member",
          university: (row.university as string) || undefined,
          created_at: (row.created_at as string) || "",
          updated_at: (row.updated_at as string) || "",
        };

        const targetPrefs = quizMap[profile.id] || {
          user_id: profile.id,
          schedule: null, social: null, cleanliness: null,
          budget_range: null, hobbies: [], pets: null,
        };

        const { percentage, breakdown } = calculateMatch(userPrefs, targetPrefs);

        return {
          profile,
          preferences: targetPrefs,
          match_percentage: percentage,
          match_breakdown: breakdown,
        };
      })
      .filter((r): r is MatchResult => r !== null)
      .sort((a, b) => b.match_percentage - a.match_percentage);

    return NextResponse.json({
      matches: results,
      total: results.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to calculate matches" },
      { status: 500 }
    );
  }
}
