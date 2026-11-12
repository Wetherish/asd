import { ApiClient } from "./client";

const TOKEN_KEY = "asd.token";

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string | null): void =>
    token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY),
};

const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};

const baseUrl = env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";
const wsUrl = env.VITE_WS_URL ?? "ws://localhost:4000/ws";

export const api = new ApiClient({
  baseUrl,
  wsUrl,
  getToken: tokenStore.get,
  setToken: tokenStore.set,
});
