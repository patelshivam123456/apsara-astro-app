import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "apsara.accessToken";
const REFRESH_TOKEN_KEY = "apsara.refreshToken";
const CLAIMS_KEY = "apsara.accessTokenClaims";
const ONBOARDING_KEY = "apsara.onboardingComplete";

export async function setSecureToken(accessToken: string | null, refreshToken?: string | null) {
  if (accessToken) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  }

  if (refreshToken !== undefined) {
    if (refreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    else await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearSecureTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
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
