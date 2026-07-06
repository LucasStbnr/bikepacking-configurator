import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, isAuthRequired } from "@/lib/auth";
import { loginAction } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isAuthRequired()) redirect("/");
  if (await getSession()) redirect("/");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted">
            Enter the password to manage setups and gear.
          </p>
        </div>

        <form action={loginAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-ink focus:ring-1 focus:ring-ink/20"
            />
          </div>

          {error ? (
            <p className="text-sm text-danger">Incorrect password — try again.</p>
          ) : null}

          <button
            type="submit"
            className="h-10 cursor-pointer rounded-md bg-ink text-sm font-medium text-background transition-colors hover:bg-ink/85"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
