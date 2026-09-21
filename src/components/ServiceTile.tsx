import { useEffect, useMemo } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";

type Props = {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress?: () => void;
  notice?: string;
};

export function ServiceTile({ title, icon, onPress, notice }: Props) {
  const { t } = useTranslation();
  const noticeOpacity = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (!notice) {
      noticeOpacity.setValue(1);
      return;
    }

    noticeOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(noticeOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(noticeOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(noticeOpacity, { toValue: 1, duration: 140, useNativeDriver: true })
    ]).start();
  }, [notice, noticeOpacity]);

  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.amber} />
      {notice ? (
        <Animated.Text style={[styles.title, styles.notice, { opacity: noticeOpacity }]} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.68}>
          {t(notice)}
        </Animated.Text>
      ) : (
        <Text variant="labelLarge" style={styles.title} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.68}>
          {t(title)}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "31%",
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm
  },
  title: { width: "100%", minHeight: 58, textAlign: "center", color: colors.ink, lineHeight: 21, includeFontPadding: true },
  notice: { color: colors.amber, fontWeight: "700" }
});
