import { View } from "react-native";
import { Text } from "react-native-paper";

import { useTranslation } from "@/context/LanguageContext";
import { PersonalityDestinyDetailsResponse, PersonalityDestinyType } from "@/services/numerology.service";

import { styles } from "./styles";
import { getPersonalityDestinySections, localizeDigitsInText } from "./utils";

export function PersonalityDestinyDetails({
  type,
  numberValue,
  details
}: {
  type: PersonalityDestinyType;
  numberValue: number;
  details: PersonalityDestinyDetailsResponse;
}) {
  const { language, t } = useTranslation();
  const titleType = type === "PERSONALITY" ? "Personality" : "Destiny";
  const sections = getPersonalityDestinySections(details);
  const firstItem = sections.flatMap(({ items }) => items).find((item) => item?.lord || item?.colour);

  return (
    <View style={styles.detailStack}>
      <View style={styles.detailSummary}>
        <Text style={styles.detailSummaryNumber}>{t(titleType)} {t("Number")} {localizeDigitsInText(numberValue || "-", language)}</Text>
        {firstItem?.lord ? <Text style={styles.detailSummaryText}>{t("Lord")}: {firstItem.lord.trim()}</Text> : null}
        {firstItem?.colour ? <Text style={styles.detailSummaryText}>{t("Colour")}: {firstItem.colour.trim()}</Text> : null}
      </View>

      {sections.map(({ key, title, items }) => (
        <View key={key} style={styles.detailCard}>
          <View style={styles.detailCardTitleWrap}>
            <Text style={styles.detailCardTitle}>
              {t(title)} {t("of")}{"\n"}{t(titleType)} {t("Number")} {localizeDigitsInText(numberValue || items[0]?.numberValue || "-", language)}
            </Text>
          </View>
          <View style={styles.detailBullets}>
            {items.map((item, index) => (
              <View key={`${key}-${index}`} style={styles.detailBulletRow}>
                <Text style={styles.detailBulletDot}>•</Text>
                <DetailPointText value={t(item.value || "")} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function DetailPointText({ value }: { value: string }) {
  const colonIndex = value.indexOf(":");
  if (colonIndex <= 0 || colonIndex > 42) {
    return <Text style={styles.detailBulletText}>{value}</Text>;
  }

  return (
    <Text style={styles.detailBulletText}>
      <Text style={styles.detailBulletLead}>{value.slice(0, colonIndex + 1)}</Text>
      {value.slice(colonIndex + 1)}
    </Text>
  );
}
