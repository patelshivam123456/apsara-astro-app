import { type LanguageCode } from "@/context/LanguageContext";

const apiLanguageNames: Record<LanguageCode, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu"
};

export function getApiLanguageName(language: LanguageCode) {
  return apiLanguageNames[language] || apiLanguageNames.en;
}
