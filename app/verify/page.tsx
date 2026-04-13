"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Step = "email" | "email-otp" | "phone" | "phone-otp" | "done";

export default function VerifyPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const supabase = createClient();
  const router = useRouter();

  // Check if user is already logged in and redirect accordingly
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const quizCompleted = user.user_metadata?.quiz_completed;
        if (quizCompleted) {
          router.push("/discover");
        }
      }
    };
    checkSession();
  }, [supabase.auth, router]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ---- EMAIL STEP ----
  const handleSendEmailOTP = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (authError) throw authError;
      setStep("email-otp");
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      // OTP is 6 digits for both email (Supabase) and phone (Twilio)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ---- VERIFY EMAIL OTP ----
  const handleVerifyEmailOTP = useCallback(async (code: string) => {
    setLoading(true);
    setError("");
    try {
      // Try "magiclink" first (returning users), then "email" (new signups)
      const { error: magicLinkError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "magiclink",
      });
      if (magicLinkError) {
        // Fallback: new user signup confirmation
        const { error: emailError } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: "email",
        });
        if (emailError) throw emailError;
      }

      // Check if this is a returning user who already completed setup
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.quiz_completed) {
        // Returning user → skip phone, go directly to app
        setStep("done");
        setTimeout(() => { router.push("/discover"); }, 1200);
        return;
      }

      setStep("phone");
      setOtp(["", "", "", "", "", ""]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid code. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [email, supabase.auth, router]);

  // ---- PHONE STEP (Supabase Phone Auth) ----
  const handleSendPhoneOTP = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!cleaned || cleaned.length < 10) {
      setError("Please enter a valid UK phone number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formatted = cleaned.startsWith("+") ? cleaned : `+44${cleaned.replace(/^0/, "")}`;

      // Supabase updateUser({ phone }) automatically sends an OTP via SMS
      // Requires Phone Auth enabled in Supabase Dashboard → Auth → Providers → Phone
      const { error: updateError } = await supabase.auth.updateUser({
        phone: formatted,
      });

      if (updateError) throw updateError;

      setStep("phone-otp");
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ---- VERIFY PHONE OTP (Supabase Phone Auth) ----
  const handleVerifyPhoneOTP = useCallback(async (code: string) => {
    setLoading(true);
    setError("");
    try {
      if (code.length !== 6) {
        throw new Error("Please enter the full 6-digit code.");
      }

      const formatted = phone.replace(/\s/g, "");
      const e164 = formatted.startsWith("+") ? formatted : `+44${formatted.replace(/^0/, "")}`;

      // Verify the OTP sent by Supabase
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: e164,
        token: code,
        type: "phone_change",
      });

      if (verifyError) throw verifyError;

      // Mark as phone verified in user metadata
      await supabase.auth.updateUser({
        data: { phone_verified: true, phone_number: phone },
      });
      setStep("done");
      // Redirect after success animation — new user goes to quiz
      setTimeout(() => {
        router.push("/quiz");
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid code.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [phone, supabase.auth, router]);

  // ---- OTP INPUT HANDLER ----
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete (6-digit codes)
    const code = newOtp.join("");
    if (code.length === 6 && newOtp.every((d) => d !== "")) {
      if (step === "email-otp") {
        handleVerifyEmailOTP(code);
      } else if (step === "phone-otp") {
        handleVerifyPhoneOTP(code);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    paste.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    const code = newOtp.join("");
    if (code.length === 6) {
      if (step === "email-otp") handleVerifyEmailOTP(code);
      else if (step === "phone-otp") handleVerifyPhoneOTP(code);
    }
  };

  // ---- SOCIAL LOGIN ----
  const handleSocialLogin = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch {
      setError("Social login failed. Try email instead.");
      setLoading(false);
    }
  };

  // Progress percentage
  const progressMap: Record<Step, number> = {
    email: 10,
    "email-otp": 35,
    phone: 55,
    "phone-otp": 80,
    done: 100,
  };
  const stepLabel =
    step === "email" || step === "email-otp" ? "Step 1 of 2" : "Step 2 of 2";

  return (
    <div className="flex min-h-dvh flex-col safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center px-4 pt-4">
        <Link
          href="/welcome"
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface"
          aria-label="Go back"
        >
          <svg className="h-5 w-5 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 pt-6">
        {/* ===== DONE STATE ===== */}
        {step === "done" ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center animate-fade-in-up">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <svg className="h-10 w-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-dark">You&apos;re Verified!</h2>
            <p className="text-dark-secondary">Welcome to the trusted PadPal community.</p>
            <p className="mt-2 text-sm text-muted">Redirecting to your lifestyle quiz...</p>
          </div>
        ) : (
          <>
            {/* Icon */}
            <div className="mb-5 flex justify-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-bg">
                {step === "email" || step === "email-otp" ? (
                  <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                ) : (
                  <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                )}
              </div>
            </div>

            {/* Title & Trust Copy */}
            {step === "email" && (
              <div className="mb-6 text-center animate-fade-in-up">
                <h1 className="mb-2 text-2xl font-bold text-dark">Let&apos;s verify your identity</h1>
                <p className="text-sm leading-relaxed text-dark-secondary">
                  Every PadPal member is verified. Your data is encrypted and never shared with other users.
                </p>
              </div>
            )}
            {step === "email-otp" && (
              <div className="mb-6 text-center animate-slide-in">
                <h1 className="mb-2 text-2xl font-bold text-dark">Check your inbox</h1>
                <p className="text-sm text-dark-secondary">
                  We sent a 6-digit code to <span className="font-medium text-dark">{email}</span>
                </p>
              </div>
            )}
            {step === "phone" && (
              <div className="mb-6 text-center animate-slide-in">
                <h1 className="mb-2 text-2xl font-bold text-dark">Now, let&apos;s add your number</h1>
                <p className="text-sm text-dark-secondary">
                  We&apos;ll send a one-time code via SMS. This keeps fake accounts out.
                </p>
              </div>
            )}
            {step === "phone-otp" && (
              <div className="mb-6 text-center animate-slide-in">
                <h1 className="mb-2 text-2xl font-bold text-dark">Enter SMS code</h1>
                <p className="text-sm text-dark-secondary">
                  Sent to <span className="font-medium text-dark">+44 {phone}</span>
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-[var(--radius-md)] border border-danger-light/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            {/* ===== EMAIL INPUT ===== */}
            {step === "email" && (
              <div className="animate-fade-in-up">
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSendEmailOTP()}
                    className="h-14 w-full rounded-[var(--radius-md)] border-2 border-border bg-white pl-12 pr-4 text-base text-dark outline-none transition-colors focus:border-primary"
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <button
                  onClick={handleSendEmailOTP}
                  disabled={loading || !email}
                  className="flex h-14 w-full items-center justify-center rounded-[var(--radius-lg)] bg-primary text-base font-semibold text-white shadow-[var(--shadow-button)] transition-all duration-200 hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                >
                  {loading ? (
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 14" />
                    </svg>
                  ) : (
                    "Send Verification Code →"
                  )}
                </button>

                {/* Terms */}
                <p className="mt-4 text-center text-xs text-muted">
                  By continuing, you agree to our{" "}
                  <a href="/terms" className="text-primary hover:underline">Terms</a> &{" "}
                  <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                </p>

                {/* Divider */}
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted">or continue with</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Social Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSocialLogin("google")}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-border text-sm font-medium text-dark transition-colors hover:bg-surface"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </div>
            )}

            {/* ===== OTP INPUT (reused for email-otp & phone-otp) ===== */}
            {(step === "email-otp" || step === "phone-otp") && (
              <div className="animate-slide-in">
                <div className="mb-6 flex justify-center gap-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`h-14 w-12 rounded-[var(--radius-md)] border-2 text-center text-xl font-bold text-dark outline-none transition-all ${
                        digit
                          ? "border-primary bg-primary-bg"
                          : "border-border bg-white focus:border-primary"
                      }`}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {/* Resend */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-muted">
                      Didn&apos;t receive it?{" "}
                      <span className="font-medium text-dark-secondary">
                        Resend in {resendTimer}s
                      </span>
                    </p>
                  ) : (
                    <button
                      onClick={() => {
                        if (step === "email-otp") handleSendEmailOTP();
                        else handleSendPhoneOTP();
                      }}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Resend code
                    </button>
                  )}
                </div>

                {/* Change email/phone */}
                <button
                  onClick={() => {
                    setStep(step === "email-otp" ? "email" : "phone");
                    setOtp(["", "", "", "", "", ""]);
                    setError("");
                  }}
                  className="mt-4 w-full text-center text-sm text-muted hover:text-dark-secondary"
                >
                  {step === "email-otp" ? "Change email address" : "Change phone number"}
                </button>
              </div>
            )}

            {/* ===== PHONE INPUT ===== */}
            {step === "phone" && (
              <div className="animate-slide-in">
                <div className="relative mb-4 flex gap-2">
                  <div className="flex h-14 items-center gap-1.5 rounded-[var(--radius-md)] border-2 border-border bg-surface px-3 text-sm font-medium text-dark">
                    <span className="text-lg">🇬🇧</span>
                    <span>+44</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSendPhoneOTP()}
                    className="h-14 flex-1 rounded-[var(--radius-md)] border-2 border-border bg-white px-4 text-base text-dark outline-none transition-colors focus:border-primary"
                    autoFocus
                    autoComplete="tel"
                  />
                </div>
                <button
                  onClick={handleSendPhoneOTP}
                  disabled={loading || !phone}
                  className="flex h-14 w-full items-center justify-center rounded-[var(--radius-lg)] bg-primary text-base font-semibold text-white shadow-[var(--shadow-button)] transition-all duration-200 hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                >
                  {loading ? (
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 14" />
                    </svg>
                  ) : (
                    "Send SMS Code →"
                  )}
                </button>

                {/* Skip phone for MVP */}
                <button
                  onClick={() => {
                    setStep("done");
                    setTimeout(() => { window.location.href = "/quiz"; }, 1500);
                  }}
                  className="mt-4 w-full text-center text-sm text-muted hover:text-dark-secondary"
                >
                  Skip for now
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Progress bar (always visible except done) */}
      {step !== "done" && (
        <div className="px-6 pb-6 pt-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{stepLabel}</span>
            <span>{progressMap[step]}%</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressMap[step]}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
