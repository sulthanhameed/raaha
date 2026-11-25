import { apiBase, boundedFetch, supabase } from "./supabase";

export interface ApiCapabilities { database: boolean; payments: boolean; notifications: boolean }

/** Browser calls only the Express REST API. JWTs are validated by the server. */
export async function apiRequest<T>(path: string, options: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: object; auth?: "required" | "optional" | "none"; expectedUserId?: string } = {}): Promise<T> {
  if (!apiBase || !supabase) throw new Error("BACKEND_UNCONFIGURED");
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.auth !== "none") {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (options.expectedUserId && data.session?.user.id !== options.expectedUserId) throw new Error("AUTH_CHANGED");
    if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
    else if (options.auth === "required") throw new Error("AUTH_REQUIRED");
  }
  const response = await boundedFetch(`${apiBase}${path}`, {
    method: options.method ?? "GET", headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  let body: unknown;
  try { body = await response.json(); } catch { throw new Error("UNCONFIRMED_RESPONSE"); }
  if (!response.ok) {
    const code = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "SERVICE_UNAVAILABLE";
    throw new Error(code);
  }
  return body as T;
}

export async function loadCapabilities(): Promise<ApiCapabilities> {
  const result = await apiRequest<ApiCapabilities>("/config", { auth: "none" });
  if (typeof result?.database !== "boolean" || typeof result.payments !== "boolean" || typeof result.notifications !== "boolean") throw new Error("INVALID_RESPONSE");
  return result;
}
