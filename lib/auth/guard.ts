import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./session";
import type { SessionUser } from "@/types/api";

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
