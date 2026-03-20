export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center safe-top safe-bottom">
      <div className="text-center">
        <div className="mb-4 flex h-12 w-12 mx-auto items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
        </div>
        <p className="text-sm text-muted">Loading...</p>
      </div>
    </div>
  );
}
