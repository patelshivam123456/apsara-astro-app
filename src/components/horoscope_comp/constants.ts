import { HoroscopePeriodOption, HoroscopeSignOption } from "./types";

export const horoscopeSigns: HoroscopeSignOption[] = [
  { key: "aries", label: "Aries", icon: "zodiac-aries", color: "#ef2f2f" },
  { key: "taurus", label: "Taurus", icon: "zodiac-taurus", color: "#f97316" },
  { key: "gemini", label: "Gemini", icon: "zodiac-gemini", color: "#f59e0b" },
  { key: "cancer", label: "Cancer", icon: "zodiac-cancer", color: "#eab308" },
  { key: "leo", label: "Leo", icon: "zodiac-leo", color: "#c2d32f" },
  { key: "virgo", label: "Virgo", icon: "zodiac-virgo", color: "#55b96b" },
  { key: "libra", label: "Libra", icon: "zodiac-libra", color: "#3cb878" },
  { key: "scorpio", label: "Scorpio", icon: "zodiac-scorpio", color: "#099a8c" },
  { key: "sagittarius", label: "Sagittarius", icon: "zodiac-sagittarius", color: "#4f46e5" },
  { key: "capricorn", label: "Capricorn", icon: "zodiac-capricorn", color: "#7c3aed" },
  { key: "aquarius", label: "Aquarius", icon: "zodiac-aquarius", color: "#a21caf" },
  { key: "pisces", label: "Pisces", icon: "zodiac-pisces", color: "#ec4899" }
];

export const horoscopePeriods: HoroscopePeriodOption[] = [
  { key: "daily", label: "Daily horoscope" },
  { key: "weekly", label: "Weekly horoscope" },
  { key: "monthly", label: "Monthly horoscope" },
  { key: "yearly", label: "Yearly horoscope" }
];

export const horoscopeTabs = [
  { key: "astrologer", label: "Astrologer" },
  { key: "divine", label: "Divine" }
] as const;
