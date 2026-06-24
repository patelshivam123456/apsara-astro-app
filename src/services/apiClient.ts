import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

import { API_BASE_URL, ASTRO_API_BASE_URL, ENDPOINTS } from "@/constants/api";
import {
  clearSecureTokens,
  getAccessToken,
  getRefreshToken,
  setSecureToken,
  setStoredClaims
} from "@/services/storage";
import { decodeAccessToken, extractAccessToken } from "@/utils/jwt";

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

function createClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    timeout: 20000,
    headers: { Accept: "*/*" }
  });

  client.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response.data,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetriableConfig | undefined;
      const status = error.response?.status;
      const isRefreshRequest = originalRequest?.url?.includes(ENDPOINTS.refreshToken);

      if (!error.response) {
        console.log("[api.network-error]", {
          message: error.message,
          baseURL: originalRequest?.baseURL,
          url: originalRequest?.url,
          method: originalRequest?.method,
          timeout: originalRequest?.timeout
        });
      } else {
        console.log("[api.response-error]", {
          status,
          baseURL: originalRequest?.baseURL,
          url: originalRequest?.url,
          method: originalRequest?.method,
          data: error.response.data
        });
      }

      if (status !== 401 || !originalRequest || originalRequest._retry || isRefreshRequest) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      refreshPromise = refreshPromise || refreshAccessToken(client);
      const nextToken = await refreshPromise.finally(() => {
        refreshPromise = null;
      });

      if (!nextToken) {
        await clearSecureTokens();
        return Promise.reject(error);
      }

      originalRequest.headers.Authorization = `Bearer ${nextToken}`;
      return client(originalRequest);
    }
  );

  return client;
}

async function refreshAccessToken(client: AxiosInstance) {
  try {
    const refreshToken = await getRefreshToken();
    const response = await client.get(ENDPOINTS.refreshToken, {
      headers: refreshToken ? { "x-refresh-token": refreshToken } : undefined
    });
    const accessToken = extractAccessToken(response);
    const nextRefreshToken =
      (response as { refreshToken?: string; data?: { refreshToken?: string } })?.refreshToken ||
      (response as { data?: { refreshToken?: string } })?.data?.refreshToken ||
      null;

    if (accessToken) {
      await setSecureToken(accessToken, nextRefreshToken || undefined);
      await setStoredClaims(decodeAccessToken(accessToken));
    }

    return accessToken;
  } catch {
    return null;
  }
}

export const api = createClient(API_BASE_URL);
export const astroApi = createClient(ASTRO_API_BASE_URL);

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong") {
  const axiosError = error as AxiosError<{ message?: string; errorDescription?: string }>;
  return (
    axiosError.response?.data?.errorDescription ||
    axiosError.response?.data?.message ||
    axiosError.message ||
    fallback
  );
}
