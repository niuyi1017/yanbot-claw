import { z } from "zod";
import { ok, fail } from "@/lib/server/response";
import { generateSchoolReport } from "@/lib/services/school-report";

const schema = z.object({
  candidate: z.object({
    score: z.number().optional(),
    major: z.string().optional(),
    target: z.string().optional(),
  }),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("invalid payload");
  return ok(await generateSchoolReport(parsed.data));
}
