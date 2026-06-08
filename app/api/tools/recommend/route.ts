import { z } from "zod";
import { ok, fail } from "@/lib/server/response";
import { recommend } from "@/lib/services/recommend";

const schema = z.object({
  score: z.number().int().min(0).max(750),
  subjectGroup: z.enum(["physics", "history"]),
  cityPrefs: z.array(z.string()).optional(),
  schoolTags: z.array(z.enum(["985", "211", "public"])).optional(),
  majorKeywords: z.array(z.string()).optional(),
  gender: z.enum(["M", "F"]).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("invalid payload");
  try {
    return ok(recommend(parsed.data));
  } catch (err) {
    console.error("[recommend]", err);
    return fail("服务暂时不可用，请稍后重试", 500);
  }
}
