export type RequestMethod = "GET" | "POST" | "PUT";

export const API_BASE_STORAGE_KEY = "meglow_api_base";
// Mini Program runtime does not provide Node globals like `process`.
// Keep the default static and let the login page override it per device/network.
const DEFAULT_API_BASE = "http://localhost:5002/api";

interface RequestOptions {
  token?: string;
  data?: Record<string, unknown>;
}

export function getApiBase(): string {
  const cached = uni.getStorageSync(API_BASE_STORAGE_KEY);
  if (typeof cached === "string" && cached.trim()) {
    return cached.trim();
  }
  return DEFAULT_API_BASE;
}

export function setApiBase(nextApiBase: string): string {
  const normalized = normalizeApiBase(nextApiBase);
  uni.setStorageSync(API_BASE_STORAGE_KEY, normalized);
  return normalized;
}

export function normalizeApiBase(rawApiBase: string): string {
  return rawApiBase.trim().replace(/\/+$/, "");
}

export async function requestApi<T>(method: RequestMethod, path: string, options: RequestOptions = {}): Promise<T> {
  const result = await uni.request({
    url: `${getApiBase()}${path}`,
    method,
    data: options.data,
    header: options.token
      ? {
          Authorization: `Bearer ${options.token}`
        }
      : undefined
  });

  const statusCode = result.statusCode ?? 0;
  if (statusCode < 200 || statusCode >= 300) {
    const message = (result.data as { message?: string } | null | undefined)?.message ?? `request failed: ${statusCode}`;
    throw new Error(message);
  }

  return result.data as T;
}
