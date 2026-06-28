import { ENDPOINTS } from "@/constants/api";
import { API_BASE_URL } from "@/constants/api";
import { api } from "@/services/apiClient";
import { clearSecureTokens, setSecureToken, setStoredClaims } from "@/services/storage";
import { ApiResponse, Astrologer, ClientProfile } from "@/types/api";
import { decodeAccessToken, extractAccessToken, normalizeRoles, stripAuthFields } from "@/utils/jwt";

export const CLIENT_ROLE_ID = 2;
export const ASTROLOGER_ROLE = "ROLE_ASTROLOGER";

export type LoginPayload = { username: string; password: string };

export type ClientRegisterPayload = {
  username: string;
  password: string;
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
  aadhaarNo: string;
  consultationModes: string[];
  documents?: {
    aadhaarFile?: UploadFile | null;
    educationalQualificationFile?: UploadFile | null;
    experienceFile?: UploadFile | null;
  };
  declaration?: {
    accepted: boolean;
    digitalSignature: string;
    date: string;
    text?: string;
  };
};

type UploadFile = {
  uri?: string;
  name?: string;
  fileName?: string;
  mimeType?: string;
  type?: string;
};

function appendArray(formData: FormData, key: string, values: string[]) {
  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value, index) => {
      formData.append(`${key}[${index}]`, value);
    });
}

function appendFile(formData: FormData, key: string, file?: UploadFile | null) {
  if (!file?.uri) return;

  formData.append(key, {
    uri: file.uri,
    name: file.name || file.fileName || `${key}.jpg`,
    type: file.mimeType || file.type || "application/octet-stream"
  } as unknown as Blob);
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

export async function registerClient(payload: ClientRegisterPayload) {
  return api.post<ApiResponse>(ENDPOINTS.createUser, {
    username: payload.username.trim(),
    password: payload.password,
    otp: payload.otp.trim(),
    roleId: CLIENT_ROLE_ID,
    clientDto: {
      publicId: "",
      firstName: payload.firstName.trim(),
      middleName: payload.middleName?.trim() || "",
      lastName: payload.lastName?.trim() || "",
      email: payload.username.trim(),
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
  });
}

export async function registerAstrologer(payload: AstrologerRegisterPayload) {
  const formData = new FormData();

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
  formData.append("yearsOfExperience", payload.yearsOfExperience.trim());
  appendArray(formData, "consultationModes", payload.consultationModes);
  formData.append("aadhaarNo", payload.aadhaarNo.trim());
  formData.append("educationalQualification", payload.educationalQualification.trim());
  appendFile(formData, "aadhaarFile", payload.documents?.aadhaarFile);
  appendFile(
    formData,
    "educationalQualificationFile",
    payload.documents?.educationalQualificationFile
  );
  appendFile(formData, "experienceFile", payload.documents?.experienceFile);

  return api.post<ApiResponse>(ENDPOINTS.astrologerRegistration, formData, {
    headers: { "Content-Type": "multipart/form-data", Accept: "*/*" }
  });
}

export async function forgotPassword(username: string) {
  return api.post<ApiResponse>(ENDPOINTS.forgotPassword, null, { params: { username } });
}

export async function resetPassword(resetToken: string, password: string) {
  return api.post<ApiResponse>(ENDPOINTS.resetPassword, { resetToken, password });
}

export async function updatePassword(oldPassword: string, password: string) {
  return api.put<ApiResponse>(ENDPOINTS.updatePassword, { oldPassword, password });
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
    return stripAuthFields((response as ApiResponse<Astrologer>)?.data || {}) as Astrologer;
  }

  const response = await api.get<ApiResponse<ClientProfile>>(ENDPOINTS.clientProfile);
  console.log("[auth.loadSessionProfile] client profile response", {
    success: (response as unknown as ApiResponse<ClientProfile>)?.success,
    hasData: !!(response as unknown as ApiResponse<ClientProfile>)?.data
  });
  return stripAuthFields((response as ApiResponse<ClientProfile>)?.data || {}) as ClientProfile;
}
