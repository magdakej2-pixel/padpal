import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim());
  }
  return _stripe;
}

// Backward compat — use in API routes
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Stripe Price IDs — set these in your .env after creating products in Stripe Dashboard
export const PRICE_IDS = {
  premium_weekly: process.env.STRIPE_PRICE_PREMIUM_WEEKLY!,
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY!,
  premium_quarterly: process.env.STRIPE_PRICE_PREMIUM_QUARTERLY!,
  boost_profile_3: process.env.STRIPE_PRICE_BOOST_PROFILE_3!,
  boost_profile_7: process.env.STRIPE_PRICE_BOOST_PROFILE_7!,
  boost_listing_3: process.env.STRIPE_PRICE_BOOST_LISTING_3!,
  boost_listing_7: process.env.STRIPE_PRICE_BOOST_LISTING_7!,
};
