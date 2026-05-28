import { z } from "zod";
import { ok, fail } from "@/lib/server/response";
import { echoMessage } from "@/lib/services/conversation";

// MVP: echo only. Future: wire to Vercel AI SDK `streamText` and return a streaming
// response consumable by `useChat` on the client.
const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string() }))
    .optional(),
  text: z.string().optional(),
});

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = schema.safeParse(await _req.json().catch(() => ({})));
  if (!parsed.success) return fail("invalid payload");

  const lastUserText =
    parsed.data.text ??
    parsed.data.messages?.filter((m) => m.role === "user").at(-1)?.content ??
    "";

  return ok({
    conversationId: id,
    reply: echoMessage(lastUserText),
  });
}
