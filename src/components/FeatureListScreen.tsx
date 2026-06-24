import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";

type Props = {
  title: string;
  subtitle: string;
  items: string[];
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
};

export function FeatureListScreen({ title, subtitle, items, icon = "star-four-points" }: Props) {
  return (
    <Screen>
      <View style={styles.hero}>
        <MaterialCommunityIcons name={icon} size={32} color={colors.amber} />
        <Text variant="headlineSmall">{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
          <Text style={{ flex: 1 }}>{item}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.xl,
    gap: spacing.sm
  },
  subtitle: { color: colors.cocoa, lineHeight: 22 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff9ef",
    borderRadius: 8,
    padding: spacing.md
  }
});
