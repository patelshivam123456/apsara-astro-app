import { Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";

type Props = {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress?: () => void;
};

export function ServiceTile({ title, icon, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.amber} />
      <Text variant="labelLarge" style={styles.title}>
        {t(title)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "31%",
    minHeight: 92,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm
  },
  title: { textAlign: "center", color: colors.ink }
});
