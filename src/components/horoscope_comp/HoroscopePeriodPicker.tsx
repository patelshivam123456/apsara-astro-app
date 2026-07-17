import { Pressable, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Menu, Text } from "react-native-paper";

import { colors } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { HoroscopePeriod } from "@/services/horoscope.service";
import { horoscopePeriods } from "./constants";
import { horoscopeStyles as styles } from "./styles";

type Props = {
  open: boolean;
  selectedPeriodLabel: string;
  onDismiss: () => void;
  onOpen: () => void;
  onSelectPeriod: (period: HoroscopePeriod) => void;
};

export function HoroscopePeriodPicker({ open, selectedPeriodLabel, onDismiss, onOpen, onSelectPeriod }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.controls}>
      <Text variant="titleMedium" style={styles.controlTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Choose horoscope")}</Text>
      <Menu
        visible={open}
        onDismiss={onDismiss}
        anchor={
          <Pressable style={styles.dropdown} onPress={onOpen}>
            <Text style={styles.dropdownText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t(selectedPeriodLabel)}</Text>
            <MaterialCommunityIcons name="chevron-down" color={colors.cocoa} size={22} />
          </Pressable>
        }
      >
        {horoscopePeriods.map((period) => (
          <Menu.Item
            key={period.key}
            title={t(period.label)}
            onPress={() => onSelectPeriod(period.key)}
          />
        ))}
      </Menu>
    </View>
  );
}
