"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Signing you in...");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically handles the OAuth code exchange
        // when using PKCE flow with the browser client.
        // We just need to check if a session was established.
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          setStatus("Authentication failed. Redirecting...");
          setTimeout(() => router.push("/verify?error=auth_failed"), 1500);
          return;
        }

        if (session?.user) {
          const meta = session.user.user_metadata || {};

          if (meta.profile_completed) {
            setStatus("Welcome back! Loading your matches...");
            setTimeout(() => router.push("/discover"), 800);
          } else if (meta.quiz_completed) {
            setStatus("Almost there! Complete your profile...");
            setTimeout(() => router.push("/profile/create"), 800);
          } else {
            setStatus("Let's set up your preferences...");
            setTimeout(() => router.push("/quiz"), 800);
          }
        } else {
          setStatus("No session found. Redirecting...");
          setTimeout(() => router.push("/verify"), 1500);
        }
      } catch (err) {
        console.error("Callback error:", err);
        setStatus("Something went wrong. Redirecting...");
        setTimeout(() => router.push("/verify?error=auth_failed"), 1500);
      }
    };

    handleCallback();
  }, [supabase.auth, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
      <svg className="mb-4 h-10 w-10 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 14" />
      </svg>
      <p className="text-lg font-semibold text-dark">{status}</p>
      <p className="mt-2 text-sm text-muted">Please wait...</p>
    </div>
  );
}
