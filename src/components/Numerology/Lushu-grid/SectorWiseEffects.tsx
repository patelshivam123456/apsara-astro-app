import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";

import { useTranslation } from "@/context/LanguageContext";
import { SectorWiseEffectsResponse } from "@/services/numerology.service";

import { sectorEffectTabs } from "./constants";
import { styles } from "./styles";
import { localizeDigitsInText } from "./utils";

export function SectorWiseEffects({ effects, translating }: { effects: SectorWiseEffectsResponse | null; translating: boolean }) {
  const { language, t } = useTranslation();

  return (
    <View style={styles.effectsBox}>
      {effects?.combinationKey ? (
        <View style={styles.combinationBadge}>
          <Text style={styles.combinationLabel}>{t("Combination Key")}</Text>
          <Text style={styles.combinationValue}>{localizeDigitsInText(effects.combinationKey, language)}</Text>
        </View>
      ) : null}
      <View style={styles.effectPanels}>
        {sectorEffectTabs.map((tab) => {
          const effectText = translating ? t("Translating...") : effects?.[tab.dataKey]?.trim() || t("No data available.");
          return (
            <View key={tab.key} style={styles.effectPanel}>
              <View style={[styles.effectIcon, { backgroundColor: tab.color }]}>
                <MaterialCommunityIcons name={tab.icon} size={25} color="#fff" />
              </View>
              <View style={styles.effectCopy}>
                <Text style={[styles.effectTitle, { color: tab.color }]}>{t(tab.title)}</Text>
                <Text style={styles.effectText}>{effectText}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
