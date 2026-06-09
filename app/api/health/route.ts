import { getDb } from "@/lib/db";
import { fail, ok } from "@/lib/server/response";

export async function GET() {
  try {
    getDb().prepare("SELECT 1").get();
    return ok({ ok: true, db: true, ts: Date.now() });
  } catch (err) {
    console.error("[health]", err);
    return fail("unhealthy", 503);
  }
}
