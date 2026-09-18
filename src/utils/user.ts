import { Astrologer, ClientProfile } from "@/types/api";
import { decodeAccessToken } from "@/utils/jwt";

export function getUserPublicId(user: ClientProfile | Astrologer | null, accessToken?: string | null) {
  const claims = decodeAccessToken(accessToken);
  return (
    claims?.uid ||
    claims?.userPublicId ||
    claims?.publicId ||
    user?.publicId ||
    ("userId" in (user || {}) ? (user as Astrologer).userId : "") ||
    ""
  );
}

export function getUserDisplayName(user: ClientProfile | Astrologer | null) {
  if (!user) return "";
  return (
    ("displayName" in user ? user.displayName : "") ||
    ("fullName" in user ? user.fullName : "") ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    ""
  );
}

export function getUserContact(user: ClientProfile | Astrologer | null) {
  return user?.mobileNo || user?.phone || ("mobileNumber" in (user || {}) ? (user as Astrologer).mobileNumber : "") || "";
}
