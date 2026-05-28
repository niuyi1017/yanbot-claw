import { z } from "zod";
import { ok, fail } from "@/lib/server/response";
import { createConversation, listConversations } from "@/lib/services/conversation";

export async function GET() {
  return ok(listConversations());
}

const createSchema = z.object({ title: z.string().min(1).max(100).optional() });

export async function POST(req: Request) {
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("invalid payload");
  return ok(createConversation(parsed.data.title ?? "新会话"));
}
