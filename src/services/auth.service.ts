import { ENDPOINTS } from "@/constants/api";
import { API_BASE_URL } from "@/constants/api";
import { api } from "@/services/apiClient";
import { clearSecureTokens, getAccessToken, getRefreshToken, setSecureToken, setStoredClaims } from "@/services/storage";
import { ApiResponse, Astrologer, ClientProfile } from "@/types/api";
import { decodeAccessToken, extractAccessToken, normalizeRoles, stripAuthFields } from "@/utils/jwt";

export const CLIENT_ROLE_ID = 2;
export const ASTROLOGER_ROLE = "ROLE_ASTROLOGER";

export type LoginPayload = { username: string; password?: string; channel?: "email" | "mobileNo"; otp?: string };

export type ClientRegisterPayload = {
  username: string;
  channel: "email" | "mobileNo";
  password?: string;
  otp: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  placeOfBirth: string;
};

export type AstrologerRegisterPayload = {
  publicId?: string;
  fullName: string;
  mobileNo: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  address?: string;
  pinCode: string;
  city: string;
  state: string;
  country: string;
  languagesKnown: string[];
  religion: string;
  specialization: string;
  displayName: string;
  expertise: string[];
  aboutYourself?: string;
  yearsOfExperience: string;
  educationalQualification: string;
  aadhaarNo?: string;
  consultationModes: string[];
  documents?: {
    certificateFiles?: UploadFile[];
    educationalQualificationFile?: UploadFile | null;
    experienceFiles?: UploadFile[];
    profileImageFile?: UploadFile | null;
  };
  step?: "basic" | "document";
};

export type AstrologerRegistrationOtpPayload = {
  step: "generate" | "validate";
  channel: "email" | "mobileNo";
  email: string;
  mobileNo: string;
  otp?: string;
};

type UploadFile = {
  uri?: string;
  name?: string;
  fileName?: string | null;
  mimeType?: string;
  type?: string | null;
};

function appendArray(formData: FormData, key: string, values: string[]) {
  const nextValue = values
    .map((value) => value.trim())
    .filter(Boolean)
    .join(",");

  if (nextValue) formData.append(key, nextValue);
}

function appendFile(formData: FormData, key: string, file?: UploadFile | null) {
  if (!file?.uri?.trim()) return;

  const fileName = file.name || file.fileName || `${key}.jpg`;
  formData.append(key, {
    uri: file.uri,
    name: fileName,
    type: getUploadMimeType(file, fileName)
  } as unknown as Blob);
}

function appendFiles(formData: FormData, key: string, files?: UploadFile[]) {
  files?.forEach((file) => appendFile(formData, key, file));
}

function getUploadMimeType(file: UploadFile, fileName: string) {
  if (file.mimeType) return file.mimeType;
  if (file.type && file.type.includes("/")) return file.type;

  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function login(payload: LoginPayload) {
  console.log("[auth.login] starting", {
    baseURL: API_BASE_URL,
    endpoint: ENDPOINTS.login,
    username: payload.username,
    passwordLength: payload.password?.length || 0
  });

  const response = await api.post<ApiResponse>(ENDPOINTS.login, payload);
  const accessToken = extractAccessToken(response);
  const refreshToken =
    (response as { refreshToken?: string; data?: { refreshToken?: string } })?.refreshToken ||
    (response as { data?: { refreshToken?: string } })?.data?.refreshToken ||
    null;

  if (accessToken) {
    await setSecureToken(accessToken, refreshToken);
    await setStoredClaims(decodeAccessToken(accessToken));
  }

  const claims = decodeAccessToken(accessToken);
  console.log("[auth.login] success", {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    uid: claims?.uid,
    roles: claims?.roles,
    authorities: claims?.authorities
  });

  return { response, accessToken, claims };
}

export async function generateOtp(username: string, channel: "email" | "mobileNo") {
  return api.post<ApiResponse>("/authorization/auth/generate-otp", { username: username.trim(), channel });
}

function buildClientRegisterBody(payload: ClientRegisterPayload) {
  return {
    username: payload.username.trim(),
    ...(payload.channel === "email" ? { password: payload.password || "" } : {}),
    otp: payload.otp.trim(),
    channel: payload.channel,
    roleId: CLIENT_ROLE_ID,
    clientDto: {
      publicId: "",
      firstName: payload.firstName.trim(),
      middleName: payload.middleName?.trim() || "",
      lastName: payload.lastName?.trim() || "",
      email: payload.channel === "email" ? payload.username.trim() : "",
      phone: payload.phone.trim(),
      otp: payload.otp.trim(),
      gender: payload.gender.trim(),
      dateOfBirth: payload.dateOfBirth.trim(),
      placeOfBirth: payload.placeOfBirth.trim(),
      timeOfBirth: "",
      countryOfBirth: "",
      address: "",
      city: "",
      state: "",
      pinCode: "",
      country: "India",
      dateOfDeath: "",
      timeOfDeath: "",
      dateOfJoining: "",
      timeOfJoining: "",
      religion: "",
      caste: "",
      gotra: "",
      motherTongue: "",
      language: "",
      fatherName: "",
      motherName: "",
      spouseName: "",
      spouseRelationship: "",
      childName: ""
    }
  };
}

export async function initiateClientSignup(payload: Omit<ClientRegisterPayload, "otp">) {
  return api.post<ApiResponse>(ENDPOINTS.signUp, buildClientRegisterBody({ ...payload, otp: "" }));
}

export async function registerClient(payload: ClientRegisterPayload) {
  const response = await api.post<ApiResponse>(ENDPOINTS.createUser, buildClientRegisterBody(payload));
  const accessToken = extractAccessToken(response);
  const refreshToken = (response as { refreshToken?: string; data?: { refreshToken?: string } })?.refreshToken ||
    (response as { data?: { refreshToken?: string } })?.data?.refreshToken || null;
  if (accessToken) {
    await setSecureToken(accessToken, refreshToken);
    await setStoredClaims(decodeAccessToken(accessToken));
  }
  return { response, accessToken, claims: decodeAccessToken(accessToken) };
}

export async function processAstrologerRegistrationOtp(payload: AstrologerRegistrationOtpPayload) {
  return api.post<ApiResponse>(ENDPOINTS.astrologerRegistrationOtpProcess, {
    step: payload.step,
    channel: payload.channel,
    email: payload.email.trim(),
    mobileNo: payload.mobileNo.trim(),
    otp: payload.otp?.trim() || ""
  });
}

export async function registerAstrologer(payload: AstrologerRegisterPayload) {
  const formData = new FormData();
  const isDocumentStep = payload.step === "document";

  if (payload.publicId) formData.append("publicId", payload.publicId);
  formData.append("fullName", payload.fullName.trim());
  formData.append("email", payload.email.trim());
  formData.append("mobileNo", payload.mobileNo.trim());
  formData.append("dateOfBirth", payload.dateOfBirth.trim());
  formData.append("gender", payload.gender.trim());
  formData.append("address", payload.address?.trim() || "");
  formData.append("city", payload.city.trim());
  formData.append("state", payload.state.trim());
  formData.append("pinCode", payload.pinCode.trim());
  formData.append("country", payload.country.trim());
  appendArray(formData, "languagesKnown", payload.languagesKnown);
  formData.append("religion", payload.religion.trim());
  formData.append("specialization", payload.specialization.trim());
  appendArray(formData, "expertise", payload.expertise);
  formData.append("aboutYourself", payload.aboutYourself?.trim() || "");
  formData.append("displayName", payload.displayName.trim());
  appendArray(formData, "consultationModes", payload.consultationModes);
  formData.append("stepBasic", "Done");

  if (isDocumentStep) {
    formData.append("yearsOfExperience", payload.yearsOfExperience.trim());
    formData.append("aadhaarNo", payload.aadhaarNo?.trim() || "null");
    formData.append("educationalQualification", payload.educationalQualification.trim());
    formData.append("stepAadhaar", "null");
    formData.append("stepDocument", "Done");
    appendFile(formData, "educationalQualificationFile", payload.documents?.educationalQualificationFile);
    appendFiles(formData, "certificateFiles", payload.documents?.certificateFiles);
    appendFiles(formData, "experienceFiles", payload.documents?.experienceFiles);
    appendFile(formData, "profileImageFile", payload.documents?.profileImageFile);
  }

  console.log("[auth.registerAstrologer] submitting", {
    endpoint: ENDPOINTS.astrologerRegistration,
    step: payload.step || "basic",
    hasPublicId: !!payload.publicId,
    educationalQualificationFile: !!payload.documents?.educationalQualificationFile?.uri,
    certificateFiles: payload.documents?.certificateFiles?.length || 0,
    experienceFiles: payload.documents?.experienceFiles?.length || 0,
    profileImageFile: !!payload.documents?.profileImageFile?.uri
  });

  return postMultipart<ApiResponse>(ENDPOINTS.astrologerRegistration, formData);
}

async function postMultipart<T>(endpoint: string, formData: FormData) {
  const [accessToken, refreshToken] = await Promise.all([getAccessToken(), getRefreshToken()]);
  const headers: Record<string, string> = { Accept: "*/*" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (refreshToken) headers["x-refresh-token"] = refreshToken;

  return new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${API_BASE_URL}${endpoint}`);
    request.timeout = 120000;

    Object.entries(headers).forEach(([key, value]) => {
      request.setRequestHeader(key, value);
    });

    request.onload = () => {
      const data = request.responseText ? safeParseJson(request.responseText) : null;
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(getResponseMessage(data) || `Request failed with status ${request.status}`));
        return;
      }
      resolve((data || {}) as T);
    };

    request.onerror = () => {
      reject(new Error("Network error while uploading documents. Please retry with the same files or check your connection."));
    };

    request.ontimeout = () => {
      reject(new Error("Document upload timed out. Please retry or use smaller files."));
    };

    request.send(formData);
  });
}

function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getResponseMessage(data: unknown) {
  const value = data as { errorDescription?: string; message?: string; error?: string };
  return value?.errorDescription || value?.message || value?.error || "";
}

function unwrapProfile<T extends Record<string, unknown>>(value: unknown): T {
  let current = value as Record<string, unknown> | null;
  const profileKeys = ["client", "clientDto", "clientProfile", "clientDetails", "profile", "profileData", "userProfile", "userDetails", "astrologer", "user", "result", "data", "content"];
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth += 1) {
    const nested = profileKeys.map((key) => current?.[key]).find((item) => item && typeof item === "object" && !Array.isArray(item));
    if (!nested) break;
    current = nested as Record<string, unknown>;
  }
  return (current || {}) as T;
}

export async function forgotPassword(username: string) {
  return api.post<ApiResponse>(ENDPOINTS.forgotPassword, null, { params: { username } });
}

export async function resetPassword(resetToken: string, password: string) {
  return api.post<ApiResponse>(ENDPOINTS.resetPassword, { resetToken, password });
}

export async function updatePassword(username: string, oldPassword: string, password: string) {
  return api.put<ApiResponse>(ENDPOINTS.updatePassword, {
    username: username.trim(),
    password,
    oldPassword
  });
}

export async function logout() {
  try {
    await api.post<ApiResponse>(ENDPOINTS.logout);
    console.log("[auth.logout] server logout success");
  } catch (error) {
    console.log("[auth.logout] server logout failed, clearing local session", {
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    await clearSecureTokens();
  }
}

export async function loadSessionProfile(claims: unknown) {
  const roles = [
    ...normalizeRoles((claims as { roles?: unknown })?.roles),
    ...normalizeRoles((claims as { authorities?: unknown })?.authorities)
  ];
  const isAstrologer = roles.includes(ASTROLOGER_ROLE);

  console.log("[auth.loadSessionProfile] loading", {
    isAstrologer,
    roles,
    endpoint: isAstrologer ? ENDPOINTS.astrologerProfile : ENDPOINTS.clientProfile
  });

  if (isAstrologer) {
    const response = await api.get<ApiResponse<Astrologer>>(ENDPOINTS.astrologerProfile);
    console.log("[auth.loadSessionProfile] astrologer profile response", {
      success: (response as unknown as ApiResponse<Astrologer>)?.success,
      hasData: !!(response as unknown as ApiResponse<Astrologer>)?.data
    });
    return stripAuthFields(unwrapProfile<Astrologer>((response as ApiResponse<Astrologer>)?.data)) as Astrologer;
  }

  const response = await api.get<ApiResponse<ClientProfile>>(ENDPOINTS.clientProfile);
  console.log("[auth.loadSessionProfile] client profile response", {
    success: (response as unknown as ApiResponse<ClientProfile>)?.success,
    hasData: !!(response as unknown as ApiResponse<ClientProfile>)?.data
  });
  return stripAuthFields(unwrapProfile<ClientProfile>((response as ApiResponse<ClientProfile>)?.data)) as ClientProfile;
}
