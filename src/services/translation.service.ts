import { type LanguageCode } from "@/context/LanguageContext";

const googleTranslateUrl = "https://translate.googleapis.com/translate_a/single";

export async function translateText(text: string, targetLanguage: LanguageCode) {
  const cleanText = text.trim();
  if (!cleanText || targetLanguage === "en") return text;

  const query = new URLSearchParams({
    client: "gtx",
    sl: "en",
    tl: targetLanguage,
    dt: "t",
    q: cleanText
  });

  const response = await fetch(`${googleTranslateUrl}?${query.toString()}`);
  if (!response.ok) {
    throw new Error("Unable to translate text");
  }

  const data = (await response.json()) as unknown;
  const translated = parseGoogleTranslation(data);
  return translated || text;
}

export async function translateUniqueTexts(texts: string[], targetLanguage: LanguageCode) {
  if (targetLanguage === "en") {
    return new Map(texts.map((text) => [text, text]));
  }

  const uniqueTexts = [...new Set(texts.filter((text) => text.trim()))];
  const translatedPairs = await Promise.all(
    uniqueTexts.map(async (text) => {
      try {
        return [text, await translateText(text, targetLanguage)] as const;
      } catch {
        return [text, text] as const;
      }
    })
  );

  return new Map(translatedPairs);
}

function parseGoogleTranslation(data: unknown) {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return "";

  return data[0]
    .map((part) => (Array.isArray(part) && typeof part[0] === "string" ? part[0] : ""))
    .join("")
    .trim();
}
