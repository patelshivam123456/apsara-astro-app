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
  const response = payload as {
    accessToken?: string;
    token?: string;
    data?: { accessToken?: string; token?: string };
  };

  return response?.accessToken || response?.token || response?.data?.accessToken || response?.data?.token || null;
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
