import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "apsara.accessToken";
const REFRESH_TOKEN_KEY = "apsara.refreshToken";
const CLAIMS_KEY = "apsara.accessTokenClaims";
const ONBOARDING_KEY = "apsara.onboardingComplete";

export async function setSecureToken(accessToken: string | null, refreshToken?: string | null) {
  if (accessToken) {
    await setTokenItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    await deleteTokenItem(ACCESS_TOKEN_KEY);
  }

  if (refreshToken !== undefined) {
    if (refreshToken) await setTokenItem(REFRESH_TOKEN_KEY, refreshToken);
    else await deleteTokenItem(REFRESH_TOKEN_KEY);
  }
}

export async function getAccessToken() {
  return getTokenItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return getTokenItem(REFRESH_TOKEN_KEY);
}

export async function clearSecureTokens() {
  await Promise.all([
    deleteTokenItem(ACCESS_TOKEN_KEY),
    deleteTokenItem(REFRESH_TOKEN_KEY),
    AsyncStorage.removeItem(CLAIMS_KEY)
  ]);
}

export async function setStoredClaims(claims: unknown) {
  await AsyncStorage.setItem(CLAIMS_KEY, JSON.stringify(claims || null));
}

export async function getStoredClaims<T>() {
  const raw = await AsyncStorage.getItem(CLAIMS_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setOnboardingComplete() {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
}

export async function hasCompletedOnboarding() {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === "true";
}

function getTokenItem(key: string) {
  if (Platform.OS === "web") return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

function setTokenItem(key: string, value: string) {
  if (Platform.OS === "web") return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}

function deleteTokenItem(key: string) {
  if (Platform.OS === "web") return AsyncStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}
