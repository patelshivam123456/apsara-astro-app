import { View } from "react-native";
import { Text } from "react-native-paper";

import { useTranslation } from "@/context/LanguageContext";
import { LoShuGridResponse } from "@/services/numerology.service";

import { defaultGrid } from "./constants";
import { styles } from "./styles";
import { localizeDigitsInText } from "./utils";

export function LoShuGrid({ grid }: { grid?: LoShuGridResponse["grid"] }) {
  const { language } = useTranslation();
  const rows = [grid?.topRow, grid?.middleRow, grid?.bottomRow].map((row, index) => row || Object.values(defaultGrid)[index]);
  return (
    <View style={styles.loShuGrid}>
      {rows.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => {
          const empty = !String(value || "").trim();
          return (
          <View key={`${rowIndex}-${colIndex}`} style={[styles.loShuCell, empty && styles.loShuCellEmpty]}>
            <Text style={[styles.loShuText, empty && styles.loShuTextEmpty]}>{localizeDigitsInText(value || "-", language)}</Text>
          </View>
          );
        })
      )}
    </View>
  );
}
