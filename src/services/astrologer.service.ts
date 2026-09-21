import { ENDPOINTS } from "@/constants/api";
import { api } from "@/services/apiClient";
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

export async function getAstrologerClients() {
  const response = await api.get<ApiResponse<ClientProfile[]>>(ENDPOINTS.astrologerClients);
  return (response as unknown as ApiResponse<ClientProfile[]>).data || [];
}
