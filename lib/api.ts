import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Pagination } from "@/lib/types";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export type ApiResult<T> =
  | { ok: true; data: T; pagination?: Pagination }
  | { ok: false; status: number; message: string };

// Calls a backend route from a server component, passing on the
// signed-in user's cookie. Returns the raw JSON body.
export async function apiFetch(path: string) {
  const cookieStore = await cookies();
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, body: body };
  } catch {
    return {
      status: 0,
      ok: false,
      body: {
        message: `Cannot reach the API at ${API_URL}. Is the backend running?`,
      },
    };
  }
}

// GET a { data, pagination } route. A 401 sends the user to the login page.
export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  const { status, ok, body } = await apiFetch(path);
  if (status == 401) {
    redirect("/login");
  }
  if (!ok) {
    return {
      ok: false,
      status: status,
      message: body.message ?? "Something went wrong.",
    };
  }
  return { ok: true, data: body.data, pagination: body.pagination };
}

// GET one record for an edit page. 404 (or a bad id) -> the not-found page.
export async function apiGetOne<T>(path: string): Promise<T> {
  const result = await apiGet<T>(path);
  if (!result.ok) {
    if (result.status == 404 || result.status == 400) {
      notFound();
    }
    throw new Error(result.message);
  }
  return result.data;
}

// Builds "?a=1&b=2" from page search params, keeping only the given keys
export function toQuery(
  searchParams: Record<string, string | string[] | undefined>,
  keys: string[],
  extra: Record<string, string> = {},
) {
  const query = new URLSearchParams(extra);
  for (const key of keys) {
    const value = searchParams[key];
    if (typeof value == "string" && value.trim() != "") {
      query.set(key, value.trim());
    }
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}
