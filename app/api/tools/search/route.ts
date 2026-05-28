import { z } from "zod";
import { ok, fail } from "@/lib/server/response";
import { search } from "@/lib/services/search";

const schema = z.object({ query: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("invalid payload");
  return ok(await search(parsed.data));
}
