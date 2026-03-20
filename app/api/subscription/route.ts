import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  // Auth check: user can only check their OWN subscription
  const { user } = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ plan: "free", isPremium: false });
  }

  // SECURITY: Use authenticated user's ID, ignore query param
  const userId = user.id;

  try {
    const { data } = await getSupabaseAdmin()
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!data || data.plan !== "premium") {
      return NextResponse.json({ plan: "free", isPremium: false });
    }

    // Check if subscription is still active
    const isActive = new Date(data.current_period_end) > new Date();

    return NextResponse.json({
      plan: isActive ? "premium" : "free",
      isPremium: isActive,
      currentPeriodEnd: data.current_period_end,
    });
  } catch (err) {
    console.error("Subscription check error:", err);
    return NextResponse.json({ plan: "free", isPremium: false });
  }
}
