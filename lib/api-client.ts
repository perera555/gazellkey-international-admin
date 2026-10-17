// Browser helper for calling the API from client components.
// /api/... is forwarded to the backend by the rewrite in next.config.ts.
// Returns { ok, status, data } and never throws on HTTP errors, so forms
// can show the API's "message" directly.
export async function apiRequest<T = { message?: string }>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: T & { message?: string } }> {
  try {
    const response = await fetch(path, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: "Network error. Please check your connection." } as T & {
        message?: string;
      },
    };
  }
}
