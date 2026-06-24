export type ApiResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  errorDescription?: string;
  data?: T;
  accessToken?: string;
  token?: string;
};

export type UserRole = "ROLE_CLIENT" | "ROLE_ASTROLOGER" | "ROLE_ADMIN";

export type TokenClaims = {
  uid?: string;
  sub?: string;
  roles?: string[] | string;
  authorities?: string[] | string;
  exp?: number;
};

export type ClientProfile = {
  publicId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  mobileNo?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
  religion?: string;
  motherTongue?: string;
  language?: string;
  roles?: string[] | string;
  authorities?: string[] | string;
};

export type Astrologer = {
  publicId?: string;
  userId?: string;
  username?: string;
  displayName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobileNo?: string;
  mobileNumber?: string;
  specialization?: string;
  expertise?: string[] | string;
  language?: string;
  languagesKnown?: string;
  city?: string;
  state?: string;
  gender?: string;
  bio?: string;
  aboutYourself?: string;
  address?: string;
  country?: string;
  pinCode?: string;
  religion?: string;
  motherTongue?: string;
  caste?: string;
  gotra?: string;
  dateOfJoining?: string;
  timeOfJoining?: string;
  profileCompletionPercentage?: number;
  yearsOfExperience?: number | string;
  pricePerMinute?: number;
  isOnline?: boolean;
  roles?: string[] | string;
  authorities?: string[] | string;
  clients?: ClientProfile[];
};
