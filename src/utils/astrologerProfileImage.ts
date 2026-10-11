import { API_BASE_URL } from "@/constants/api";
import { Astrologer } from "@/types/api";

export function getAstrologerProfileImage(astrologer: Astrologer) {
  const raw =
    astrologer.profileImage ||
    astrologer.profileImagePath ||
    astrologer.profileImageUrl ||
    astrologer.profileImageFilePath ||
    "";
  return normalizeImagePath(raw);
}

function normalizeImagePath(value: string) {
  const path = value.trim();
  if (!path) return "";
  if (/^(https?:|data:image\/|file:|content:)/i.test(path)) return path;
  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}
