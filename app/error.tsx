"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="text-center">
        <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-danger/10">
          <svg className="h-8 w-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-bold text-dark">Something went wrong</h1>
        <p className="mb-6 text-sm text-muted">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="mb-3 flex h-12 w-full items-center justify-center rounded-[var(--radius-lg)] bg-primary font-semibold text-white shadow-[var(--shadow-button)] transition-all active:scale-[0.98]"
        >
          Try Again
        </button>
        <a href="/home" className="block text-sm text-muted hover:text-dark-secondary">
          Go to Home
        </a>
      </div>
    </div>
  );
}
