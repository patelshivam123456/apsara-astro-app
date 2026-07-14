import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";

import { useTranslation } from "@/context/LanguageContext";
import { LoShuRepetitionEffectItem } from "@/services/numerology.service";

import { defaultGridCells } from "./constants";
import { styles } from "./styles";
import { localizeDigitsInText } from "./utils";

export function LoShuRepetitionEffectsSection({ effects }: { effects: LoShuRepetitionEffectItem[] }) {
  const { language, t } = useTranslation();
  const sortedEffects = [...effects].sort((first, second) => Number(first.loShuNumber || 0) - Number(second.loShuNumber || 0));
  const generalNote = sortedEffects.find((item) => item.generalNote?.trim())?.generalNote;

  if (!sortedEffects.length) return null;

  return (
    <View style={styles.repetitionSection}>
      <View style={styles.repetitionHero}>
        <View style={styles.repetitionHeroCopy}>
          <Text style={styles.repetitionKicker}>{t("Meaning of repetition")}</Text>
          <Text style={styles.repetitionTitle}>{t("Lo Shu Grid Number Effects")}</Text>
        </View>
        <RepetitionGrid effects={sortedEffects} />
      </View>
      <View style={styles.repetitionCards}>
        {sortedEffects.map((effect) => (
          <View key={`${effect.loShuNumber}-${effect.id || effect.repetitionCount}`} style={styles.repetitionCard}>
            <View style={styles.repetitionIcon}>
              <MaterialCommunityIcons name={getRepetitionIcon(effect.repetitionCount)} size={30} color="#1255c8" />
            </View>
            <View style={styles.repetitionCopy}>
              <Text style={[styles.repetitionCardTitle, getRepetitionTitleStyle(effect.repetitionCount)]}>
                {localizeDigitsInText(t(effect.title || "-"), language)}
              </Text>
              <Text style={styles.repetitionCardText}>{localizeDigitsInText(t(effect.meaning || t("No data available.")), language)}</Text>
            </View>
          </View>
        ))}
      </View>
      {generalNote ? (
        <View style={styles.repetitionNoteRow}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#07225f" />
          <Text style={styles.repetitionNote}>{t(generalNote)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function RepetitionGrid({ effects }: { effects: LoShuRepetitionEffectItem[] }) {
  const { language, t } = useTranslation();
  const cells = Array.from({ length: 9 }, (_, index) => {
    const row = Math.floor(index / 3) + 1;
    const column = (index % 3) + 1;
    const loShuNumber = Number(defaultGridCells[index]);
    return (
      effects.find((item) => Number(item.gridRow) === row && Number(item.gridColumn) === column) ||
      effects.find((item) => Number(item.loShuNumber) === loShuNumber) || {
        loShuNumber,
        gridRow: row,
        gridColumn: column,
        repetitionCount: 0
      }
    );
  });

  return (
    <View style={styles.repetitionGrid}>
      {cells.map((effect, index) => {
        const count = Number(effect?.repetitionCount || 0);
        const numberText = String(effect?.loShuNumber ?? defaultGridCells[index] ?? "-");
        const cellText = count > 0 ? numberText.repeat(count) : numberText;
        return (
          <View
            key={`${effect?.loShuNumber || index}-${index}`}
            style={[styles.repetitionGridCell, count > 0 ? styles.repetitionGridCellActive : styles.repetitionGridCellMissing]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
              style={[
                styles.repetitionGridNumber,
                !count && styles.repetitionGridNumberMissing,
                count >= 3 && styles.repetitionGridNumberMany
              ]}
            >
              {localizeDigitsInText(cellText, language)}
            </Text>
            {!count ? <Text style={styles.repetitionGridMissingLabel}>{t("Missing")}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function getRepetitionIcon(count?: number): keyof typeof MaterialCommunityIcons.glyphMap {
  if (!count) return "selection-remove";
  if (count === 1) return "account-outline";
  if (count === 2) return "account-multiple-outline";
  return "account-group-outline";
}

function getRepetitionTitleStyle(count?: number) {
  if (!count) return styles.repetitionTitleMissing;
  if (count === 1) return styles.repetitionTitleOnce;
  if (count === 2) return styles.repetitionTitleTwice;
  return styles.repetitionTitleMany;
}
