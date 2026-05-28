import type { ApiEnvelope } from "@/types/api";

export class ApiError extends Error {
  constructor(public status: number, public code: number, message: string) {
    super(message);
  }
}

export async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = (await res.json().catch(() => undefined)) as ApiEnvelope<T> | undefined;
  if (!res.ok || !body || body.code !== 0) {
    throw new ApiError(res.status, body?.code ?? -1, body?.message ?? `HTTP ${res.status}`);
  }
  return body.data as T;
}
