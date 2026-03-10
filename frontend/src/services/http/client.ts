export type RequestMethod = "GET" | "POST" | "PUT";

const API_BASE = process.env.UNI_APP_API_BASE || "http://localhost:3000/api";

interface RequestOptions {
  token?: string;
  data?: Record<string, unknown>;
}

export async function requestApi<T>(method: RequestMethod, path: string, options: RequestOptions = {}): Promise<T> {
  const result = await uni.request({
    url: `${API_BASE}${path}`,
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
