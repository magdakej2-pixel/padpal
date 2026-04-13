import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { getAuthUser } from "@/lib/supabase-server";
import { isRateLimited, getRateLimitKey, sanitizeString, isValidUUID } from "@/lib/security";

// Admin client (bypasses RLS to read any user's subscriptions)
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    // Auth check — only authenticated users can send push notifications
    const { user } = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, title, body, url, tag } = await req.json();

    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: "Missing or invalid userId" }, { status: 400 });
    }

    // Rate limit: 10 pushes per minute per IP
    const rlKey = getRateLimitKey(req, "push-send");
    if (isRateLimited(rlKey, 10)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // SECURITY: Verify sender has an active conversation with recipient
    const admin = getAdmin();
    const { data: conv } = await admin
      .from("conversations")
      .select("id")
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
      .limit(1)
      .maybeSingle();

    if (!conv) {
      return NextResponse.json({ error: "No conversation with this user" }, { status: 403 });
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: "VAPID keys not configured. Run: npx web-push generate-vapid-keys" },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(
      "mailto:support@padpal.co.uk",
      vapidPublicKey,
      vapidPrivateKey
    );

    // Get user's push subscriptions
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscriptions found" });
    }

    const payload = JSON.stringify({
      title: title || "PadPal",
      body: body || "You have a new notification",
      url: url || "/home",
      tag: tag || "padpal-notification",
    });

    let sent = 0;
    const expired: string[] = [];

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        // 410 Gone = subscription expired, clean up
        if (statusCode === 410 || statusCode === 404) {
          expired.push(sub.id);
        }
      }
    }

    // Clean up expired subscriptions
    if (expired.length > 0) {
      await admin
        .from("push_subscriptions")
        .delete()
        .in("id", expired);
    }

    return NextResponse.json({ sent, expired: expired.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send push";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
