import { API_BASE_URL, ENDPOINTS } from "@/constants/api";
import { api } from "@/services/apiClient";
import { getAccessToken } from "@/services/storage";
import { ApiResponse, Astrologer, ClientProfile } from "@/types/api";

export async function getAstrologers() {
  const response = await api.get<ApiResponse<Astrologer[]>>(ENDPOINTS.astrologers);
  return (response as unknown as ApiResponse<Astrologer[]>).data || [];
}

export async function getAstrologerById(publicId: string) {
  const astrologers = await getAstrologers();
  const decodedId = decodeURIComponent(publicId);
  return astrologers.find((item) => item.publicId === decodedId || item.userId === decodedId || item.email === decodedId);
}

export async function getAstrologerProfile() {
  const response = await api.get<ApiResponse<Astrologer>>(ENDPOINTS.astrologerProfile);
  return (response as unknown as ApiResponse<Astrologer>).data || {};
}

export async function updateAstrologerProfile(profile: Astrologer) {
  return api.put<ApiResponse>(ENDPOINTS.updateAstrologerProfile, {
    publicId: profile.publicId || profile.userId || "",
    firstName: profile.firstName || "",
    middleName: profile.middleName || "",
    lastName: profile.lastName || "",
    fullName: profile.fullName || [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" "),
    displayName: profile.displayName || "",
    email: profile.email || "",
    mobileNo: profile.mobileNo || profile.mobileNumber || profile.phone || "",
    aadhaarNo: profile.aadhaarNo || "",
    aadhaarFileUuid: profile.aadhaarFileUuid || "",
    aboutYourself: profile.aboutYourself || profile.bio || "",
    address: profile.address || "",
    city: profile.city || "",
    consultationModes: normalizeList(profile.consultationModes),
    state: profile.state || "",
    pinCode: profile.pinCode || "",
    country: profile.country || "",
    dateOfBirth: profile.dateOfBirth || "",
    gender: profile.gender || "",
    dateOfJoining: profile.dateOfJoining || "",
    timeOfJoining: profile.timeOfJoining || "",
    educationalQualification: profile.educationalQualification || "",
    educationalQualificationFileUuid: profile.educationalQualificationFileUuid || "",
    experienceFileUuid: profile.experienceFileUuid || "",
    expertise: normalizeList(profile.expertise),
    languagesKnown: normalizeList(profile.languagesKnown || profile.language),
    motherTongue: profile.motherTongue || "",
    profileStatus: profile.profileStatus || "",
    religion: profile.religion || "",
    specialization: profile.specialization || "",
    yearsOfExperience: String(profile.yearsOfExperience || ""),
    profileCompletionPercentage: profile.profileCompletionPercentage || 0
  });
}

export async function getDownloadFileRequest(fileId: string, fileType: string) {
  const token = await getAccessToken();
  const headers: Record<string, string> = { Accept: "application/octet-stream,application/pdf,image/*,*/*" };
  if (token) headers.Authorization = `Bearer ${token}`;

  return {
    url: `${API_BASE_URL}${ENDPOINTS.downloadFile}?fileId=${encodeURIComponent(fileId)}&fileType=${encodeURIComponent(fileType)}`,
    headers
  };
}

export async function getAstrologerClients() {
  const response = await api.get<ApiResponse<ClientProfile[]>>(ENDPOINTS.astrologerClients);
  return (response as unknown as ApiResponse<ClientProfile[]>).data || [];
}

function normalizeList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}
