import { View } from "react-native";
import { Text } from "react-native-paper";

import { useTranslation } from "@/context/LanguageContext";
import { LoShuGridResponse } from "@/services/numerology.service";

import { defaultGrid } from "./constants";
import { styles } from "./styles";
import { localizeDigitsInText } from "./utils";

export function LoShuGrid({ grid, large, showEmptyDash = true }: { grid?: LoShuGridResponse["grid"]; large?: boolean; showEmptyDash?: boolean }) {
  const { language } = useTranslation();
  const rows = [grid?.topRow, grid?.middleRow, grid?.bottomRow].map((row, index) => row || Object.values(defaultGrid)[index]);
  return (
    <View style={[styles.loShuGrid, large && styles.loShuGridLarge]}>
      {rows.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => {
          const empty = !String(value || "").trim();
          const displayValue = value || (showEmptyDash ? "-" : "");
          return (
          <View key={`${rowIndex}-${colIndex}`} style={[styles.loShuCell, large && styles.loShuCellLarge, empty && styles.loShuCellEmpty]}>
            <Text style={[styles.loShuText, large && styles.loShuTextLarge, empty && styles.loShuTextEmpty]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62}>{localizeDigitsInText(displayValue, language)}</Text>
          </View>
          );
        })
      )}
    </View>
  );
}
