import crypto from "node:crypto";
import type { YanbotResponse } from "@/types/domain";

/**
 * Mirrors yanbot/src/modules/open-api/middlewares/auth.ts:
 *   signature = HMAC-SHA256(apiKey + timestamp + nonce, apiSecret)
 */
export function generateSignature(
  apiKey: string,
  timestamp: string,
  nonce: string,
  apiSecret: string
): string {
  return crypto
    .createHmac("sha256", apiSecret)
    .update(`${apiKey}${timestamp}${nonce}`)
    .digest("hex");
}

export class YanbotApiError extends Error {
  readonly statusCode: number;
  readonly code?: number;
  readonly raw?: unknown;

  constructor(opts: { message: string; statusCode: number; code?: number; raw?: unknown }) {
    super(opts.message);
    this.name = "YanbotApiError";
    this.statusCode = opts.statusCode;
    this.code = opts.code;
    this.raw = opts.raw;
  }
}

export interface YanbotClientOptions {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  timeoutMs?: number;
}

export class YanbotClient {
  constructor(private readonly opts: YanbotClientOptions) {}

  private buildAuthHeaders(): Record<string, string> {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomUUID();
    return {
      "x-api-key": this.opts.apiKey,
      "x-timestamp": timestamp,
      "x-nonce": nonce,
      "x-signature": generateSignature(this.opts.apiKey, timestamp, nonce, this.opts.apiSecret),
    };
  }

  async get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    const url = new URL(path, this.opts.baseUrl);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.opts.timeoutMs ?? 10_000);

    let res: Response;
    try {
      res = await fetch(url, { headers: this.buildAuthHeaders(), signal: controller.signal });
    } catch (err) {
      throw new YanbotApiError({
        message: err instanceof Error ? err.message : "network error",
        statusCode: 0,
      });
    } finally {
      clearTimeout(timer);
    }

    const body = (await res.json().catch(() => undefined)) as YanbotResponse<T> | undefined;
    if (!res.ok || !body?.success) {
      throw new YanbotApiError({
        message: body?.message || `Yanbot API failed (HTTP ${res.status})`,
        statusCode: res.status,
        code: body?.code,
        raw: body,
      });
    }
    return body.data as T;
  }
}

let _client: YanbotClient | null = null;
export function getYanbotClient(): YanbotClient {
  if (_client) return _client;
  const baseUrl = process.env.YANBOT_BASE_URL;
  const apiKey = process.env.OPEN_API_KEY;
  const apiSecret = process.env.OPEN_API_SECRET;
  if (!baseUrl || !apiKey || !apiSecret) {
    throw new Error("YANBOT_BASE_URL / OPEN_API_KEY / OPEN_API_SECRET must be set");
  }
  _client = new YanbotClient({ baseUrl, apiKey, apiSecret });
  return _client;
}
