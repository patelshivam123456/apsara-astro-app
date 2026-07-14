import { View } from "react-native";
import { Text } from "react-native-paper";

import { useTranslation } from "@/context/LanguageContext";

import { personalYearNotes } from "./constants";
import { styles } from "./styles";
import { localizeDigitsInText } from "./utils";

export function PersonalYearReading({ value }: { value?: string }) {
  const { language, t } = useTranslation();

  return (
    <View style={styles.readingBox}>
      <Text style={styles.readingTitle}>{t("Personal Year reading")}</Text>
      {personalYearNotes.map((note, index) => (
        <Text key={note} style={styles.readingText}>- {index === 0 && value ? `${t("Your running personal year is")} ${localizeDigitsInText(value, language)}.` : t(note)}</Text>
      ))}
    </View>
  );
}
