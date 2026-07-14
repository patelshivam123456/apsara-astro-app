import { ScrollView, View } from "react-native";
import { Text } from "react-native-paper";

import { type LanguageCode, useTranslation } from "@/context/LanguageContext";
import { PersonalYearMatrixItem } from "@/services/numerology.service";

import { months } from "./constants";
import { styles } from "./styles";
import { getMonthValue, localizeDigitsInText } from "./utils";

export function MatrixTable({ rows }: { rows: PersonalYearMatrixItem[] }) {
  const { language, t } = useTranslation();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.matrixTable}>
        <View style={styles.matrixTopHeader}>
          <Text style={[styles.matrixHeadCell, styles.matrixYear, styles.matrixTallHead]}>{t("Year")}</Text>
          <Text style={[styles.matrixHeadCell, styles.matrixPersonal, styles.matrixTallHead]}>{t("Personal\nYear")}</Text>
          <Text style={styles.matrixMonthGroup}>{t("Personal Month")}</Text>
        </View>
        <View style={styles.matrixMonthHeader}>
          <View style={[styles.matrixHeadSpacer, styles.matrixYear]} />
          <View style={[styles.matrixHeadSpacer, styles.matrixPersonal]} />
          {months.map(([shortMonth]) => <Text key={shortMonth} style={styles.matrixHeadCell}>{t(shortMonth)}</Text>)}
        </View>
        {rows.map((row) => (
          <View key={row.year} style={styles.matrixRow}>
            <Text style={[styles.matrixCell, styles.matrixYear]}>{localizeDigitsInText(row.year, language)}</Text>
            <PersonalYearMatrixValue value={row.personalYear || "-"} language={language} />
            {months.map(([shortMonth, fullMonth]) => (
              <Text key={shortMonth} style={styles.matrixCell}>{localizeDigitsInText(getMonthValue(row, shortMonth, fullMonth), language)}</Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function PersonalYearMatrixValue({ value, language }: { value: string | number; language: LanguageCode }) {
  const text = String(value || "-");
  const slashIndex = text.indexOf("/");

  if (text === "-" || slashIndex === -1) {
    return (
      <View style={[styles.matrixCell, styles.matrixPersonal, styles.matrixPersonalValueCell]}>
        <Text style={styles.matrixPersonalYearText}>{localizeDigitsInText(text, language)}</Text>
      </View>
    );
  }

  const firstValue = text.slice(0, slashIndex);
  const lastValue = text.slice(slashIndex + 1);

  return (
    <View style={[styles.matrixCell, styles.matrixPersonal, styles.matrixPersonalValueCell]}>
      <Text style={styles.matrixPersonalYearText}>
        <Text style={styles.matrixPersonalYearFirst}>{localizeDigitsInText(firstValue, language)}</Text>
        <Text style={styles.matrixPersonalYearSlash}>/</Text>
        <Text style={styles.matrixPersonalYearLast}>{localizeDigitsInText(lastValue, language)}</Text>
      </Text>
    </View>
  );
}
