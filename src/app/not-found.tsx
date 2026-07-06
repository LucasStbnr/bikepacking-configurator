import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-28 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">Error 404</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        This trail doesn&apos;t exist
      </h1>
      <p className="max-w-sm text-sm text-muted">
        The page you&apos;re looking for was moved, deleted, or never packed in the first
        place.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-9 items-center rounded-md bg-ink px-4 text-sm font-medium text-background transition-colors hover:bg-ink/85"
      >
        Back to setups
      </Link>
    </div>
  );
}
