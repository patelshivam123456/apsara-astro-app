import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Avatar, Button, Chip, Text } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { Astrologer } from "@/types/api";

type Props = {
  astrologer: Astrologer;
  onChat?: () => void;
  onCall?: () => void;
  onView?: () => void;
};

function getName(astrologer: Astrologer) {
  return (
    astrologer.displayName ||
    astrologer.fullName ||
    [astrologer.firstName, astrologer.lastName].filter(Boolean).join(" ") ||
    "Apsara Expert"
  );
}

export function AstrologerCard({ astrologer, onChat, onCall, onView }: Props) {
  const { t } = useTranslation();
  const name = getName(astrologer);
  const skills = Array.isArray(astrologer.expertise)
    ? astrologer.expertise.join(", ")
    : astrologer.specialization || astrologer.expertise || "Astrology";
  const experience = astrologer.yearsOfExperience || "5";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <Pressable style={styles.card} onPress={onView}>
      <View style={styles.top}>
        <View>
          <Avatar.Text size={58} label={initials || "AA"} style={styles.avatar} labelStyle={styles.avatarLabel} />
          <View style={[styles.statusDot, { backgroundColor: astrologer.isOnline === false ? "#a0a0a0" : colors.success }]} />
        </View>
        <View style={styles.info}>
          <Text variant="titleMedium" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.76}>{name}</Text>
          <Text style={styles.muted} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>{experience}+ {t("years")} • {t(String(skills))}</Text>
          <View style={styles.meta}>
            <Chip compact icon="currency-inr">₹{astrologer.pricePerMinute || 25}/min</Chip>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Button mode="outlined" icon="chat" compact onPress={onChat}>{t("Chat")}</Button>
        <Button mode="contained-tonal" icon="phone" compact onPress={onCall}>{t("Call")}</Button>
        <Button mode="text" compact onPress={onView}>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.amber} />
        </Button>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.md
  },
  top: { flexDirection: "row", gap: spacing.md },
  avatar: { backgroundColor: colors.ink },
  avatarLabel: { color: colors.lime },
  statusDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.surface
  },
  info: { flex: 1, minWidth: 0, gap: spacing.xs },
  muted: { color: colors.cocoa, lineHeight: 19 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.sm }
});
