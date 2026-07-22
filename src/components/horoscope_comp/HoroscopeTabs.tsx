import { Pressable, View } from "react-native";
import { Text } from "react-native-paper";

import { useTranslation } from "@/context/LanguageContext";
import { horoscopeTabs } from "./constants";
import { horoscopeStyles as styles } from "./styles";
import { ActiveHoroscopeTab } from "./types";

type Props = {
  activeTab: ActiveHoroscopeTab;
  hasDivine: boolean;
  onChangeTab: (tab: ActiveHoroscopeTab) => void;
};

export function HoroscopeTabs({ activeTab, hasDivine, onChangeTab }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.tabs}>
      {horoscopeTabs.map((tab) => {
        const enabled = tab.key === "astrologer" ? true : hasDivine;
        return (
          <Pressable
            key={tab.key}
            disabled={!enabled}
            style={[styles.tab, activeTab === tab.key && styles.tabActive, !enabled && styles.tabDisabled]}
            onPress={() => onChangeTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive, !enabled && styles.tabTextDisabled]}>
              {t(tab.label)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
