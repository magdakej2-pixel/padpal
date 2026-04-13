import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuthUser } from "@/lib/supabase-server";
import { isRateLimited, getRateLimitKey } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rlKey = getRateLimitKey(req, "checkout");
    if (isRateLimited(rlKey, 10)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    // Auth check
    const { user } = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Stripe init
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      console.error("STRIPE_SECRET_KEY is not set");
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }
    const stripe = new Stripe(secretKey);

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid or empty request body" }, { status: 400 });
    }

    const { priceId: rawPriceId, mode } = body;
    const priceId = rawPriceId?.trim();

    // SECURITY: Force userId from authenticated session, not from request body
    const userId = user.id;

    // SECURITY: Validate mode parameter
    const validModes = ["subscription", "payment"];
    const checkedMode = validModes.includes(mode) ? mode : "subscription";

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    console.log("Creating checkout session:", { priceId, userId, mode });

    // SECURITY: Always use server-controlled redirect URLs (prevents open redirect)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://padpal-xi.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: checkedMode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/premium?success=true`,
      cancel_url: `${appUrl}/premium?canceled=true`,
      metadata: {
        userId,
        ...(body.boostType && { boostType: body.boostType }),
        ...(body.boostDays && { boostDays: String(body.boostDays) }),
        ...(body.listingId && { listingId: body.listingId }),
      },
      allow_promotion_codes: true,
    });

    console.log("Checkout session created:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Checkout error:", message);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: message },
      { status: 500 }
    );
  }
}
