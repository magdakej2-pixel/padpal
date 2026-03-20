import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="animate-fade-in-up text-center">
        {/* Logo */}
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-[var(--radius-xl)] bg-primary shadow-[var(--shadow-button)]">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 4L8 12V28L20 36L32 28V12L20 4Z"
              stroke="white"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M14 18C14 18 16 22 20 22C24 22 26 18 26 18"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="15" cy="15" r="1.5" fill="white" />
            <circle cx="25" cy="15" r="1.5" fill="white" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-3xl font-bold text-dark">
          Pad<span className="text-primary">Pal</span>
        </h1>
        <p className="mb-8 text-base text-dark-secondary">
          Find Your Perfect Flatmate
        </p>

        {/* CTA */}
        <Link
          href="/welcome"
          className="mb-4 inline-flex h-14 w-full max-w-xs items-center justify-center rounded-[var(--radius-lg)] bg-primary text-lg font-semibold text-white shadow-[var(--shadow-button)] transition-all duration-200 hover:bg-primary-dark hover:shadow-[var(--shadow-card)] active:scale-[0.98]"
        >
          Get Started →
        </Link>

        <p className="mt-4 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/verify" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>

      {/* Trust indicators */}
      <div className="mt-12 flex items-center gap-6 text-xs text-muted animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <span className="flex items-center gap-1">
          <svg className="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Verified Users
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          AI Matching
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-4 w-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          GDPR Safe
        </span>
      </div>
    </div>
  );
}
