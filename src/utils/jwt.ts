import { TokenClaims } from "@/types/api";

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return globalThis.atob ? globalThis.atob(padded) : "";
}

export function decodeAccessToken(token?: string | null): TokenClaims | null {
  if (!token) return null;
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    return JSON.parse(decodeBase64Url(payload)) as TokenClaims;
  } catch {
    return null;
  }
}

export function normalizeRoles(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((role) => role.trim()).filter(Boolean);
  return String(value).split(",").map((role) => role.trim()).filter(Boolean);
}

export function extractAccessToken(payload: unknown): string | null {
  const tokenKeys = ["accessToken", "access_token", "token"];
  const queue: Array<{ value: unknown; depth: number }> = [{ value: payload, depth: 0 }];
  const seen = new Set<object>();
  while (queue.length) {
    const { value, depth } = queue.shift()!;
    if (!value || typeof value !== "object" || seen.has(value as object)) continue;
    seen.add(value as object);
    const record = value as Record<string, unknown>;
    for (const key of tokenKeys) if (typeof record[key] === "string" && record[key]) return record[key] as string;
    if (depth < 4) {
      for (const child of Object.values(record)) {
        if (child && typeof child === "object") queue.push({ value: child, depth: depth + 1 });
      }
    }
  }
  return null;
}

export function stripAuthFields<T extends Record<string, unknown>>(value: T | null | undefined) {
  if (!value) return value;
  const { password, otp, token, accessToken, refreshToken, ...rest } = value;
  void password;
  void otp;
  void token;
  void accessToken;
  void refreshToken;
  return rest as Omit<T, "password" | "otp" | "token" | "accessToken" | "refreshToken">;
}
