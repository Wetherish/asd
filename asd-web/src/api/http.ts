import { ApiError, type ApiErrorBody } from "./types";

export type HttpClientOptions = {
  baseUrl: string; // e.g. "http://localhost:4000/api/v1"
  getToken: () => string | null;
};

export type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

export function createHttp({ baseUrl, getToken }: HttpClientOptions) {
  return async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, ...rest } = options;
    const headers = new Headers(rest.headers);
    if (body !== undefined) headers.set("Content-Type", "application/json");
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const init: RequestInit = { ...rest, headers };
    if (body !== undefined) init.body = JSON.stringify(body);

    const res = await fetch(`${baseUrl}${path}`, init);
    if (!res.ok) {
      let body: ApiErrorBody | undefined;
      try {
        body = (await res.json()) as ApiErrorBody;
      } catch {
        // non-JSON error body — fall through to statusText
      }
      throw new ApiError(body?.code ?? "internal", body?.message ?? res.statusText, res.status, body?.details);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  };
}
