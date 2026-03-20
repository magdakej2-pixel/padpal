import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      if (!userId) break;

      if (session.mode === "subscription") {
        // Premium subscription
        const subResponse = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const subscription = subResponse as unknown as { current_period_end: number };

        await getSupabaseAdmin().from("user_subscriptions").upsert(
          {
            user_id: userId,
            plan: "premium",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      } else if (session.mode === "payment") {
        // One-time boost
        const boostType = session.metadata?.boostType;
        const boostDays = parseInt(session.metadata?.boostDays || "3");
        const listingId = session.metadata?.listingId;

        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + boostDays);

        await getSupabaseAdmin().from("boosts").insert({
          user_id: userId,
          type: boostType || "profile",
          listing_id: listingId || null,
          ends_at: endsAt.toISOString(),
          stripe_payment_id: session.payment_intent as string,
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subUpdated = event.data.object as unknown as { customer: string; status: string; current_period_end: number };
      const customerId = subUpdated.customer;

      // Find user by stripe customer ID
      const { data: sub } = await getSupabaseAdmin()
        .from("user_subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (sub) {
        await getSupabaseAdmin().from("user_subscriptions").update({
          plan: subUpdated.status === "active" ? "premium" : "free",
          current_period_end: new Date(
            subUpdated.current_period_end * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("user_id", sub.user_id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subDeleted = event.data.object as unknown as { customer: string };
      const customerId = subDeleted.customer;

      await getSupabaseAdmin()
        .from("user_subscriptions")
        .update({
          plan: "free",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
