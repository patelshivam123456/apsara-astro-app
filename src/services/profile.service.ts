import { ENDPOINTS } from "@/constants/api";
import { api } from "@/services/apiClient";
import { ApiResponse, ClientProfile } from "@/types/api";

export async function getClientProfile() {
  const response = await api.get<ApiResponse<ClientProfile>>(ENDPOINTS.clientProfile);
  return (response as unknown as ApiResponse<ClientProfile>).data || {};
}

export async function updateClientProfile(profile: ClientProfile) {
  return api.put<ApiResponse>(ENDPOINTS.updateClientProfile, {
    publicId: profile.publicId || "",
    firstName: profile.firstName || "",
    middleName: profile.middleName || "",
    lastName: profile.lastName || "",
    email: profile.email || "",
    mobileNo: profile.mobileNo || profile.phone || "",
    address: profile.address || "",
    city: profile.city || "",
    state: profile.state || "",
    pinCode: profile.pinCode || "",
    country: profile.country || "",
    gender: profile.gender || "",
    dateOfBirth: profile.dateOfBirth || "",
    timeOfBirth: profile.timeOfBirth || "",
    placeOfBirth: profile.placeOfBirth || "",
    countryOfBirth: "",
    dateOfDeath: "",
    timeOfDeath: "",
    dateOfJoining: "",
    timeOfJoining: "",
    religion: profile.religion || "",
    caste: "",
    gotra: "",
    motherTongue: profile.motherTongue || "",
    language: profile.language || "",
    fatherName: "",
    motherName: "",
    spouseName: "",
    spouseRelationship: "",
    childName: ""
  });
}

export async function deleteClientProfile(publicId: string) {
  return api.delete<ApiResponse>(ENDPOINTS.deleteClientProfile, { params: { clientId: publicId } });
}
