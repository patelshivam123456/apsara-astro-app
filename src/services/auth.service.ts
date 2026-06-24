import { ENDPOINTS } from "@/constants/api";
import { API_BASE_URL } from "@/constants/api";
import { api } from "@/services/apiClient";
import { clearSecureTokens, setSecureToken, setStoredClaims } from "@/services/storage";
import { ApiResponse, Astrologer, ClientProfile } from "@/types/api";
import { decodeAccessToken, extractAccessToken, normalizeRoles, stripAuthFields } from "@/utils/jwt";

export const CLIENT_ROLE_ID = 2;
export const ASTROLOGER_ROLE_ID = 3;
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
  mobileNumber: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  fullAddress?: string;
  pincode: string;
  city: string;
  state: string;
  languagesKnown: string[];
  expertise: string[];
  aboutYourself?: string;
  consultationModes: string[];
  password: string;
  otp: string;
  declaration?: {
    accepted: boolean;
    digitalSignature: string;
    date: string;
    text?: string;
  };
};

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

export async function requestOtp(username: string, password: string) {
  return api.post<ApiResponse>(ENDPOINTS.signUp, { username, password }, {
    headers: { "Content-Type": "application/json", Accept: "*/*" }
  });
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
  return api.post<ApiResponse>(ENDPOINTS.createUser, {
    username: payload.email.trim(),
    password: payload.password,
    otp: payload.otp.trim(),
    roleId: ASTROLOGER_ROLE_ID,
    astrologerDto: {
      fullName: payload.fullName.trim(),
      mobileNumber: payload.mobileNumber.trim(),
      email: payload.email.trim(),
      otp: payload.otp.trim(),
      gender: payload.gender.trim(),
      dateOfBirth: payload.dateOfBirth.trim(),
      address: payload.fullAddress?.trim() || "",
      pincode: payload.pincode.trim(),
      city: payload.city.trim(),
      state: payload.state.trim(),
      languagesKnown: payload.languagesKnown.join(", "),
      expertise: payload.expertise,
      aboutYourself: payload.aboutYourself?.trim() || "",
      consultationModes: payload.consultationModes,
      identityVerification: { aadharFront: [], aadharBack: [] },
      educationCertification: { educationalCertificates: [], certificateDocuments: [] },
      experienceDocuments: { experienceLetter: [], passportPhoto: [] },
      declaration: {
        accepted: payload.declaration?.accepted ?? false,
        digitalSignature: payload.declaration?.digitalSignature?.trim() || "",
        date: payload.declaration?.date?.trim() || "",
        text: payload.declaration?.text || "I hereby declare that all information provided is true and I have no criminal record."
      },
      verificationStatus: "PENDING"
    }
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
