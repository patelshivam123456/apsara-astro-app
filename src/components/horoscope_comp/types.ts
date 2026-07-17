import { MaterialCommunityIcons } from "@expo/vector-icons";

import { HoroscopePeriod, HoroscopeSign } from "@/services/horoscope.service";

export type ActiveHoroscopeTab = "astrologer" | "divine";

export type HoroscopeSignOption = {
  key: HoroscopeSign;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
};

export type HoroscopePeriodOption = {
  key: HoroscopePeriod;
  label: string;
};
