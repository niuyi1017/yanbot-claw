import { ok } from "@/lib/server/response";

export async function GET() {
  return ok({ ok: true, ts: Date.now() });
}
