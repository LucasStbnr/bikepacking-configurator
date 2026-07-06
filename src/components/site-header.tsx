"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/login/actions";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Setups" },
  { href: "/products", label: "Gear library" },
  { href: "/compare", label: "Compare" },
] as const;

export function SiteHeader({ showAuth }: { showAuth: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-8 px-5">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-[17px] font-semibold tracking-tight">
            Packrig
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-faint transition-colors group-hover:text-muted sm:inline">
            bikepacking setup builder
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/" || pathname.startsWith("/setups")
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-line/60 font-medium text-ink"
                    : "text-muted hover:bg-line/40 hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}

          {showAuth ? (
            <form action={logoutAction} className="ml-1">
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-line/40 hover:text-ink"
              >
                Sign out
              </button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
