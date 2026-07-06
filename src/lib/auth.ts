import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "bp_session";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  return process.env.SESSION_SECRET ?? "dev-secret-change-me";
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("hex");
}

/** Auth is only enforced when ADMIN_PASSWORD env var is set. */
export function isAuthRequired(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export async function getSession(): Promise<boolean> {
  if (!isAuthRequired()) return true;
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return false;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return false;
  const ts = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);
  if (Date.now() - Number(ts) > TTL_MS) return false;
  const expected = sign(ts);
  try {
    return timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/** Call from Server Actions — redirects to /login if not authenticated. */
export async function requireAuth(): Promise<void> {
  if (!(await getSession())) redirect("/login");
}

export async function createSession(): Promise<void> {
  const ts = String(Date.now());
  const store = await cookies();
  store.set(COOKIE, `${ts}.${sign(ts)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TTL_MS / 1000,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = createHmac("sha256", "pwd").update(input).digest();
  const b = createHmac("sha256", "pwd").update(expected).digest();
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
