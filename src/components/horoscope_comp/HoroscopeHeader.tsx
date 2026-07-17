import { router } from "expo-router";
import { Button, Text } from "react-native-paper";
import { View } from "react-native";

import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "@/context/LanguageContext";
import { horoscopeStyles as styles } from "./styles";

export function HoroscopeHeader() {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <Button mode="text" icon="arrow-left" compact onPress={() => router.back()} style={styles.headerAction}>
        {t("Back")}
      </Button>
      <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
        {t("My Horoscope")}
      </Text>
      <LanguageSelector />
    </View>
  );
}
