import { View } from "react-native";
import { Text } from "react-native-paper";

import { useTranslation } from "@/context/LanguageContext";

import { styles } from "./styles";
import { localizeDigitsInText } from "./utils";

export function SectionLabel({ title }: { title: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.68}>
        {title}
      </Text>
    </View>
  );
}

export function GridIntro({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.gridIntro}>
      <View style={styles.gridIntroTitleWrap}>
        <Text style={styles.gridIntroTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>
          {title}
        </Text>
      </View>
      <Text style={styles.gridIntroDescription} numberOfLines={5} adjustsFontSizeToFit minimumFontScale={0.72}>
        {description}
      </Text>
    </View>
  );
}

export function NumberCard({ label, value, note }: { label: string; value?: string | number; note?: string }) {
  const { language } = useTranslation();
  return (
    <View style={styles.numberCard}>
      <Text style={styles.numberLabel} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.68}>{label}</Text>
      <Text style={styles.numberValue}>{localizeDigitsInText(value ?? "-", language)}</Text>
      {note ? <Text style={styles.numberNote} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{note}</Text> : null}
    </View>
  );
}

type SummaryItem = {
  label: string;
  value?: string | number;
  note?: string;
};

export function NumberSummaryGrid({ rows }: { rows: SummaryItem[][] }) {
  const { language } = useTranslation();
  return (
    <View style={styles.numberSummaryBox}>
      {rows.map((row, rowIndex) => (
        <View key={`summary-row-${rowIndex}`} style={[styles.numberSummaryRow, rowIndex > 0 && styles.numberSummaryRowDivider]}>
          {row.map((item, itemIndex) => (
            <View key={`${item.label}-${itemIndex}`} style={styles.numberSummaryCellWrap}>
              <View style={styles.numberSummaryCell}>
                <Text style={styles.numberLabel} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.68}>{item.label}</Text>
                <Text style={styles.numberValue}>{localizeDigitsInText(item.value ?? "-", language)}</Text>
                {item.note ? <Text style={styles.numberNote} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{item.note}</Text> : null}
              </View>
              {itemIndex < row.length - 1 ? <View style={styles.numberSummaryDivider} /> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
