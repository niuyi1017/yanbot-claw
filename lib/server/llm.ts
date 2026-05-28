// Single-place LLM provider config. Not consumed in MVP — present so future
// services/* can `import { llm } from "@/lib/server/llm"` without hunting for setup.

import { createOpenAI } from "@ai-sdk/openai";

let _openai: ReturnType<typeof createOpenAI> | null = null;

export function openai() {
  if (_openai) return _openai;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  _openai = createOpenAI({ apiKey });
  return _openai;
}
