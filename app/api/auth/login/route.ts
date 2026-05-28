import { NextResponse } from "next/server";
import { z } from "zod";
import { signSession, SESSION_COOKIE } from "@/lib/auth/session";
import { ok, fail } from "@/lib/server/response";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("invalid payload");

  const { username, password } = parsed.data;
  const expectedUser = process.env.MVP_ADMIN_USER;
  const expectedPass = process.env.MVP_ADMIN_PASS;
  if (!expectedUser || !expectedPass) return fail("server admin not configured", 500);

  if (username !== expectedUser || password !== expectedPass) {
    return fail("用户名或密码错误", 401);
  }

  const token = await signSession({ id: "admin", username, role: "admin" });
  const res = ok({ username, role: "admin" });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
