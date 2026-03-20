"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { startCheckout, usePremium } from "@/lib/use-premium";

const FEATURES = [
  { title: "Search Together Mode", description: "Browse homes jointly with your matched roommate", free: false },
  { title: "Unlimited Property Adds", description: "Add as many external properties as you want", free: false },
  { title: "Shared Board Comments", description: "Comment and discuss on shared listings", free: false },
  { title: "Real-time Notifications", description: "Get instant alerts when your partner likes a place", free: false },
  { title: "Better Matching", description: "Advanced compatibility algorithm for better results", free: false },
  { title: "See Your Matches", description: "View who you matched with", free: true },
];

const PLANS = [
  { id: "weekly", envKey: "NEXT_PUBLIC_STRIPE_PRICE_WEEKLY", label: "Weekly", price: "£4.99", period: "/week", popular: false, savings: "" },
  { id: "monthly", envKey: "NEXT_PUBLIC_STRIPE_PRICE_MONTHLY", label: "Monthly", price: "£9.99", period: "/month", popular: true, savings: "Save 50%" },
  { id: "quarterly", envKey: "NEXT_PUBLIC_STRIPE_PRICE_QUARTERLY", label: "3 Months", price: "£19.99", period: "/3 months", popular: false, savings: "Save 67%" },
];

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center"><p>Loading...</p></div>}>
      <PremiumContent />
    </Suspense>
  );
}

function PremiumContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const { isPremium, loading: premiumLoading } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    getUser();
  }, []);

  const handleSubscribe = async () => {
    if (!userId) return;
    setLoading(true);
    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan) return;

    const priceMap: Record<string, string | undefined> = {
      weekly: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY,
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY,
      quarterly: process.env.NEXT_PUBLIC_STRIPE_PRICE_QUARTERLY,
    };
    const priceId = priceMap[selectedPlan];

    if (!priceId) {
      alert(`Setup required: Add NEXT_PUBLIC_STRIPE_PRICE_${selectedPlan.toUpperCase()} to your Vercel environment variables with the Stripe Price ID for the ${plan.label} plan.\n\nGo to stripe.com → Products → Create Product → Copy the Price ID.`);
      setLoading(false);
      return;
    }

    const result = await startCheckout({
      priceId,
      mode: "subscription",
      userId,
    });
    if (!result?.url) {
      const msg = [result?.error, result?.details].filter(Boolean).join("\n\n");
      alert(msg || "Failed to start checkout. Please try again.");
    }
    setLoading(false);
  };

  // Success state
  if (success === "true") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-surface px-6">
        <div className="text-center animate-fade-in-up">
          <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10"><svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
          <h1 className="mb-2 text-2xl font-bold text-dark">Welcome to Premium!</h1>
          <p className="mb-6 text-sm text-dark-secondary">You now have access to all premium features.</p>
          <Link href="/search-together" className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-primary font-bold text-white shadow-lg">
            Start Searching Together
          </Link>
          <Link href="/home" className="mt-3 block text-sm text-muted">Go to Home</Link>
        </div>
      </div>
    );
  }

  // Already premium
  if (!premiumLoading && isPremium) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-surface px-6">
        <div className="text-center">
          <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10"><svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
          <h1 className="mb-2 text-2xl font-bold text-dark">You&apos;re Premium!</h1>
          <p className="mb-6 text-sm text-dark-secondary">You have access to all premium features.</p>
          <Link href="/search-together" className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-primary font-bold text-white shadow-lg">
            Search Together
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white safe-top safe-bottom">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#004D40] px-5 pb-8 pt-6">
        <Link href="/profile" className="mb-4 inline-flex items-center text-sm text-white/70">← Back</Link>
        <div className="relative z-10">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">PREMIUM</div>
          <h1 className="text-2xl font-bold text-white mb-1">Search Together, Better</h1>
          <p className="text-sm text-white/80 max-w-[280px]">Unlock the full power of collaborative house hunting with your matched roommate</p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -right-5 top-16 h-24 w-24 rounded-full bg-white/5" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 -mt-4">
        {/* Features */}
        <div className="rounded-[var(--radius-xl)] bg-white p-5 shadow-md border border-border">
          <h3 className="mb-4 text-sm font-semibold text-muted uppercase tracking-wide">What&apos;s included</h3>
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                  {f.free ? (
                    <svg className="h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-dark">{f.title}</span>
                    {f.free && <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">FREE</span>}
                  </div>
                  <p className="text-xs text-muted">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">Choose your plan</h3>
          <div className="space-y-2.5">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative flex w-full items-center justify-between rounded-[var(--radius-lg)] border-2 p-4 transition-all ${
                  selectedPlan === plan.id
                    ? "border-primary bg-primary-bg shadow-md"
                    : plan.popular
                    ? "border-primary/30 bg-primary-bg/30"
                    : "border-border bg-white"
                }`}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-dark">{plan.label}</span>
                    {plan.popular && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">MOST POPULAR</span>}
                  </div>
                  {plan.savings && <span className="text-xs font-medium text-success">{plan.savings}</span>}
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-dark">{plan.price}</span>
                  <span className="text-xs text-muted">{plan.period}</span>
                </div>
                {selectedPlan === plan.id && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs">✓</div>
                )}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-muted">
          Auto-renews. Cancel anytime. By subscribing you agree to our <Link href="/terms" className="text-primary underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.
        </p>
      </div>

      {/* CTA */}
      <div className="border-t border-border px-5 py-4 bg-white">
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-primary font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Redirecting to payment..." : "Subscribe Now"}
        </button>
        <p className="mt-2 text-center text-xs text-muted">Auto-renews. Cancel anytime.</p>
      </div>
    </div>
  );
}
