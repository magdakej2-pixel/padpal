import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="text-center">
        <p className="mb-2 text-6xl font-bold text-border">404</p>
        <h1 className="mb-2 text-xl font-bold text-dark">Page not found</h1>
        <p className="mb-6 text-sm text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/home"
          className="flex h-12 w-full items-center justify-center rounded-[var(--radius-lg)] bg-primary font-semibold text-white shadow-[var(--shadow-button)] transition-all active:scale-[0.98]"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
