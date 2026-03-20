"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface PremiumStatus {
  isPremium: boolean;
  plan: string;
  loading: boolean;
}

export function usePremium(): PremiumStatus {
  const [status, setStatus] = useState<PremiumStatus>({
    isPremium: false,
    plan: "free",
    loading: true,
  });

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setStatus({ isPremium: false, plan: "free", loading: false });
        return;
      }

      try {
        const res = await fetch(`/api/subscription`);
        const data = await res.json();
        setStatus({
          isPremium: data.isPremium,
          plan: data.plan,
          loading: false,
        });
      } catch {
        setStatus({ isPremium: false, plan: "free", loading: false });
      }
    }
    check();
  }, []);

  return status;
}

export async function startCheckout(params: {
  priceId: string;
  mode: "subscription" | "payment";
  userId: string;
  successUrl?: string;
  cancelUrl?: string;
  boostType?: string;
  boostDays?: number;
  listingId?: string;
}) {
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Checkout failed", details: data.details };
    }
    if (data.url) {
      window.location.href = data.url;
    }
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { error: message };
  }
}
