import { NextResponse } from "next/server";
import type { ApiEnvelope } from "@/types/api";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiEnvelope<T>>({ code: 0, data }, init);
}

export function fail(message: string, status = 400, code = -1) {
  return NextResponse.json<ApiEnvelope>({ code, message }, { status });
}
