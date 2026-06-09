import { z } from "zod";
import { ok, fail } from "@/lib/server/response";
import { generateVibeReport } from "@/lib/services/school-report";

const schema = z.object({
  score: z.number().int().min(200).max(750),
  subjectGroup: z.enum(["physics", "history"]),
  majorKeywords: z.array(z.string()).optional(),
  regionPrefs: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("invalid payload");
  try {
    return ok(generateVibeReport(parsed.data));
  } catch (err) {
    console.error("[school-report/vibe]", err);
    return fail("服务暂时不可用，请稍后重试", 500);
  }
}
