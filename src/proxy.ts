import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "bp_session";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return true; // auth disabled in dev
  const raw = request.cookies.get(COOKIE)?.value;
  if (!raw) return false;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return false;
  const ts = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);
  if (Date.now() - Number(ts) > TTL_MS) return false;
  const secret = process.env.SESSION_SECRET ?? "dev-secret-change-me";
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
  } catch {
    return false;
  }
  const macBytes = Uint8Array.from(
    (mac.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)),
  );
  const dataBytes = new TextEncoder().encode(ts);
  try {
    return await crypto.subtle.verify("HMAC", key, macBytes, dataBytes);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    if (await isAuthenticated(request)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!(await isAuthenticated(request))) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
