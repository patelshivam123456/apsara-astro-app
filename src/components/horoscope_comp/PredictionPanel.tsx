import { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

import { ErrorState } from "@/components/StateViews";
import { LanguageCode, useTranslation } from "@/context/LanguageContext";
import { HoroscopePredictionMap } from "@/services/horoscope.service";
import { translateUniqueTexts } from "@/services/translation.service";
import { toTitle } from "./helpers";
import { horoscopeStyles as styles } from "./styles";

type Props = {
  title: string;
  meta?: string;
  prediction?: HoroscopePredictionMap;
  colorCodes?: string[];
  percentages?: Record<string, number>;
};

export function PredictionPanel({ title, meta, prediction, colorCodes, percentages }: Props) {
  const { language, t } = useTranslation();
  const translatedPrediction = useTranslatedPrediction(prediction, language);
  const entries = Object.entries(translatedPrediction || {}).filter(([, value]) => value !== undefined && value !== "");

  if (!entries.length) {
    return <ErrorState message="No horoscope details available" />;
  }

  return (
    <View style={styles.panel}>
      <Text variant="titleLarge" style={styles.panelTitle} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>{title}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}

      {entries.map(([key, value]) => (
        <View key={key} style={styles.readingCard}>
          <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>
            {t(toTitle(key))}
          </Text>
          {Array.isArray(value) ? (
            value.map((line) => (
              <Text key={line} style={styles.bodyText}>
                {line}
              </Text>
            ))
          ) : (
            <Text style={styles.bodyText}>{String(value)}</Text>
          )}
        </View>
      ))}

      {colorCodes?.length ? (
        <View style={styles.extraCard}>
          <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Lucky colors")}</Text>
          <View style={styles.colorRow}>
            {colorCodes.map((colorCode) => (
              <View key={colorCode} style={styles.colorItem}>
                <View style={[styles.colorSwatch, { backgroundColor: colorCode }]} />
                <Text style={styles.meta}>{colorCode}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {percentages ? (
        <View style={styles.extraCard}>
          <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Horoscope percentage")}</Text>
          {Object.entries(percentages).map(([key, value]) => (
            <View key={key} style={styles.percentRow}>
              <Text style={styles.percentLabel}>{t(toTitle(key))}</Text>
              <View style={styles.percentTrack}>
                <View style={[styles.percentFill, { width: `${Math.max(0, Math.min(100, value))}%` }]} />
              </View>
              <Text style={styles.percentValue}>{value}%</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function useTranslatedPrediction(prediction: HoroscopePredictionMap | undefined, language: LanguageCode) {
  const [translatedPrediction, setTranslatedPrediction] = useState<HoroscopePredictionMap | undefined>(prediction);

  useEffect(() => {
    let mounted = true;

    async function translatePrediction() {
      if (!prediction || language === "en") {
        if (mounted) setTranslatedPrediction(prediction);
        return;
      }

      const strings = Object.values(prediction).flatMap((value) => {
        if (Array.isArray(value)) return value;
        return typeof value === "string" ? [value] : [];
      });

      const translations = await translateUniqueTexts(strings, language);
      const nextPrediction = Object.fromEntries(
        Object.entries(prediction).map(([key, value]) => {
          if (Array.isArray(value)) {
            return [key, value.map((line) => translations.get(line) || line)];
          }
          if (typeof value === "string") {
            return [key, translations.get(value) || value];
          }
          return [key, value];
        })
      ) as HoroscopePredictionMap;

      if (mounted) setTranslatedPrediction(nextPrediction);
    }

    translatePrediction();

    return () => {
      mounted = false;
    };
  }, [language, prediction]);

  return translatedPrediction;
}
