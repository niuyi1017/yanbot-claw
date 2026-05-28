import { ok } from "@/lib/server/response";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const res = ok({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
