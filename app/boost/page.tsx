"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { startCheckout } from "@/lib/use-premium";

const BOOST_OPTIONS = [
  { days: 3, price: "£2.99", multiplier: "3x", description: "3 days of extra visibility" },
  { days: 7, price: "£4.99", multiplier: "5x", popular: true, description: "7 days — best value" },
];

export default function BoostPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center"><p>Loading...</p></div>}>
      <BoostContent />
    </Suspense>
  );
}

function BoostContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "profile";
  const success = searchParams.get("success");

  const isProfile = type === "profile";
  const title = isProfile ? "Boost Your Profile" : "Boost Your Listing";
  const subtitle = isProfile ? "Be seen by more potential roommates" : "Be seen by more potential tenants";
  const backHref = isProfile ? "/profile" : "/listings";

  const [selectedDays, setSelectedDays] = useState(7);
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

  const handleBoost = async () => {
    if (!userId) return;
    setLoading(true);

    const envKey = `NEXT_PUBLIC_STRIPE_PRICE_BOOST_${type.toUpperCase()}_${selectedDays}`;
    const priceId = process.env[envKey];

    if (!priceId) {
      alert(`Setup required: Add ${envKey} to your .env file with the Stripe Price ID.\n\nGo to stripe.com → Products → Create a one-time product → Copy the Price ID.`);
      setLoading(false);
      return;
    }

    await startCheckout({
      priceId,
      mode: "payment",
      userId,
      boostType: type,
      boostDays: selectedDays,
      successUrl: `${window.location.origin}/boost?type=${type}&success=true`,
      cancelUrl: `${window.location.origin}/boost?type=${type}&canceled=true`,
    });
    setLoading(false);
  };

  // Success state
  if (success === "true") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-surface px-6">
        <div className="text-center animate-fade-in-up">
          <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10"><svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
          <h1 className="mb-2 text-2xl font-bold text-dark">Boost Activated!</h1>
          <p className="mb-6 text-sm text-dark-secondary">Your {isProfile ? "profile" : "listing"} is now boosted and will get more visibility.</p>
          <Link href={backHref} className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-primary font-bold text-white shadow-lg">
            Back to {isProfile ? "Profile" : "Listings"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white safe-top safe-bottom">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#B85400] px-5 pb-8 pt-6">
        <Link href={backHref} className="mb-4 inline-flex items-center text-sm text-white/70">← Back</Link>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          <p className="text-sm text-white/80">{subtitle}</p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 -mt-4">
        {/* How it works */}
        <div className="rounded-[var(--radius-xl)] bg-white p-5 shadow-md border border-border">
          <h3 className="mb-4 text-sm font-semibold text-muted uppercase tracking-wide">How boost works</h3>
          <div className="space-y-3">
            {[
              { step: 1, title: "Priority placement", desc: `Your ${isProfile ? "profile" : "listing"} appears at the top of search results` },
              { step: 2, title: "More views", desc: `Get up to 5x more views than non-boosted ${isProfile ? "profiles" : "listings"}` },
              { step: 3, title: "Highlighted badge", desc: "A badge makes you stand out" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface border border-border text-xs font-bold text-dark-secondary">{item.step}</div>
                <div>
                  <p className="text-sm font-semibold text-dark">{item.title}</p>
                  <p className="text-xs text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Boost options */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">Choose duration</h3>
          <div className="space-y-3">
            {BOOST_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setSelectedDays(opt.days)}
                className={`relative flex w-full items-center justify-between rounded-[var(--radius-lg)] border-2 p-5 transition-all ${
                  selectedDays === opt.days
                    ? "border-primary bg-primary-bg shadow-md"
                    : "border-border bg-white"
                }`}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-dark">{opt.days}-Day Boost</span>
                    {opt.popular && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">BEST VALUE</span>}
                  </div>
                  <p className="text-xs text-muted mt-0.5">{opt.description}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="rounded-full bg-surface border border-border px-2 py-0.5 text-xs font-semibold text-dark-secondary">{opt.multiplier} more views</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-dark">{opt.price}</span>
                </div>
                {selectedDays === opt.days && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs">✓</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-[var(--radius-lg)] bg-surface p-4 text-center">
          <p className="text-xs text-muted mb-1">Boosted users get on average</p>
          <p className="text-2xl font-bold text-primary">4.2x</p>
          <p className="text-xs text-muted">more matches</p>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-border px-5 py-4 bg-white">
        <button
          onClick={handleBoost}
          disabled={loading}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-primary font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Redirecting to payment..." : `Boost Now — ${BOOST_OPTIONS.find((o) => o.days === selectedDays)?.price}`}
        </button>
      </div>
    </div>
  );
}
