import { z } from "zod";
import { ok, fail } from "@/lib/server/response";
import { generateContent } from "@/lib/services/content";

const schema = z.object({
  source: z.union([
    z.object({ kind: z.literal("feed"), id: z.string() }),
    z.object({ kind: z.literal("topic"), topic: z.string() }),
  ]),
  format: z.enum(["xhs", "video-script"]),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("invalid payload");
  return ok(await generateContent(parsed.data));
}
