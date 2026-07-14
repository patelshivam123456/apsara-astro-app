import { View } from "react-native";
import { Text } from "react-native-paper";

import { useTranslation } from "@/context/LanguageContext";

import { styles } from "./styles";
import { localizeDigitsInText } from "./utils";

export function SectionLabel({ title }: { title: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelText}>{title}</Text>
    </View>
  );
}

export function GridIntro({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.gridIntro}>
      <View style={styles.gridIntroTitleWrap}>
        <Text style={styles.gridIntroTitle}>{title}</Text>
      </View>
      <Text style={styles.gridIntroDescription}>{description}</Text>
    </View>
  );
}

export function NumberCard({ label, value, note }: { label: string; value?: string | number; note?: string }) {
  const { language } = useTranslation();
  return (
    <View style={styles.numberCard}>
      <Text style={styles.numberLabel}>{label}</Text>
      <Text style={styles.numberValue}>{localizeDigitsInText(value ?? "-", language)}</Text>
      {note ? <Text style={styles.numberNote} numberOfLines={1}>{note}</Text> : null}
    </View>
  );
}
