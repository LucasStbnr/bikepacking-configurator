import { db } from "@/db";
import { setups } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    db.select({ id: setups.id }).from(setups).limit(1).all();
    return Response.json({ status: "ok", db: "ok" });
  } catch (err) {
    return Response.json(
      { status: "error", db: String(err) },
      { status: 503 },
    );
  }
}
