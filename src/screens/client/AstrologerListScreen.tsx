import { useMemo, useState } from "react";
import { FlatList, GestureResponderEvent, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Avatar, Badge, Button, Chip, IconButton, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import {
  AstrologerFilterModal,
  defaultAstrologerFilters,
  filterAstrologers,
  getActiveAstrologerFilterCount,
  getAstrologerFilterOptions,
  getAstrologerRouteId,
  splitAstrologerValues,
  AstrologerFilterState
} from "@/components/AstrologerFilters";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { useAstrologers } from "@/hooks/useAstrologers";
import { Astrologer } from "@/types/api";

function getName(astrologer: Astrologer) {
  return astrologer.displayName || astrologer.fullName || [astrologer.firstName, astrologer.lastName].filter(Boolean).join(" ") || "Apsara Expert";
}

function getSkills(astrologer: Astrologer) {
  return splitAstrologerValues(astrologer.expertise).join(", ") || astrologer.specialization || "Astrology";
}

export function AstrologerListScreen() {
  const { t } = useTranslation();
  const query = useAstrologers();
  const [filters, setFilters] = useState<AstrologerFilterState>(defaultAstrologerFilters);
  const [filterVisible, setFilterVisible] = useState(false);

  const data = query.data || [];
  const filterOptions = useMemo(() => getAstrologerFilterOptions(data), [data]);
  const filtered = useMemo(() => filterAstrologers(data, filters), [data, filters]);
  const activeFilterCount = getActiveAstrologerFilterCount(filters);

  if (query.isLoading) return <LoadingState label="Loading astrologers" />;
  if (query.isError) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message="Unable to load astrologers" onRetry={() => query.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={filtered}
        keyExtractor={(item, index) => item.publicId || item.email || String(index)}
        renderItem={({ item }) => <AstrologerResultCard astrologer={item} />}
        refreshing={query.isRefetching}
        onRefresh={() => query.refetch()}
        ListHeaderComponent={(
          <View style={styles.top}>
            <View style={styles.header}>
              <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
              <Text variant="titleLarge" style={styles.title}>{t("Astrologers")}</Text>
              <View style={styles.filterIconWrap}>
                <IconButton icon="tune-variant" mode="contained-tonal" size={21} onPress={() => setFilterVisible(true)} />
                {activeFilterCount ? <Badge style={styles.filterBadge}>{activeFilterCount}</Badge> : null}
              </View>
            </View>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>{filtered.length} {t(filtered.length === 1 ? "astrologer" : "astrologers")}</Text>
              <Text style={styles.resultMuted}>{t("Showing matching experts")}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<EmptyState title="No astrologers found" description="Try changing the filters." />}
      />
      <AstrologerFilterModal
        filters={filters}
        onChange={setFilters}
        onClose={() => setFilterVisible(false)}
        options={filterOptions}
        visible={filterVisible}
      />
      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}

function AstrologerResultCard({ astrologer }: { astrologer: Astrologer }) {
  const { t } = useTranslation();
  const name = getName(astrologer);
  const skills = getSkills(astrologer);
  const years = astrologer.yearsOfExperience || "5";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const routeId = getAstrologerRouteId(astrologer);
  const openDetails = () => {
    if (routeId) router.push(`/astrologers/${routeId}`);
  };
  const stopCardPress = (event?: GestureResponderEvent) => event?.stopPropagation();

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={openDetails}>
      <View style={styles.cardTop}>
        <View style={styles.avatarWrap}>
          <Avatar.Text size={72} label={initials || "AA"} style={styles.avatar} labelStyle={styles.avatarLabel} />
          <View style={[styles.onlineDot, { backgroundColor: astrologer.isOnline === false ? "#9a9a9a" : colors.success }]} />
        </View>
        <View style={styles.cardInfo}>
          <Text variant="titleLarge" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.76} style={styles.cardName}>{name}</Text>
          <Text style={styles.cardMeta} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>{years}+ {t("years")} • {t(skills)}</Text>
          <View style={styles.cardBadges}>
            <Chip compact icon="currency-inr" style={styles.priceChip} textStyle={styles.priceText}>₹{astrologer.pricePerMinute || 25}/min</Chip>
            <Chip compact icon={astrologer.isOnline === false ? "clock-outline" : "check-circle"} style={styles.statusChip} textStyle={styles.statusText}>
              {t(astrologer.isOnline === false ? "Offline" : "Online")}
            </Chip>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={28} color={colors.amber} style={styles.cardChevron} />
      </View>
      <View style={styles.cardActions}>
        <Button mode="outlined" icon="chat" textColor={colors.amber} style={styles.outlineAction} contentStyle={styles.actionContent} disabled onPress={stopCardPress}>{t("Chat")}</Button>
        <Button mode="contained-tonal" icon="phone" style={styles.callAction} contentStyle={styles.actionContent} disabled onPress={stopCardPress}>{t("Call")}</Button>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f7f7" },
  list: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 96, gap: spacing.md },
  top: { gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.ink, fontWeight: "900", fontSize: 19, lineHeight: 24, textAlign: "center" },
  filterIconWrap: { width: 70, alignItems: "flex-end", justifyContent: "center" },
  filterBadge: { position: "absolute", top: 2, right: 0, backgroundColor: colors.danger },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  resultTitle: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "900" },
  resultMuted: { color: colors.cocoa, fontSize: 12, lineHeight: 16 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: "#6b5309",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },
  cardPressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  cardTop: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  avatarWrap: { width: 88, alignItems: "center" },
  avatar: { backgroundColor: colors.ink },
  avatarLabel: { color: colors.lime, fontSize: 24, fontWeight: "900" },
  onlineDot: { width: 15, height: 15, borderRadius: 8, marginTop: spacing.sm, borderWidth: 2, borderColor: colors.surface },
  cardInfo: { flex: 1, minWidth: 0, gap: spacing.sm },
  cardName: { color: colors.ink, fontWeight: "900", lineHeight: 30 },
  cardMeta: { color: colors.cocoa, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  cardBadges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" },
  priceChip: { alignSelf: "flex-start", backgroundColor: "#e8ddf8" },
  priceText: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  statusChip: { alignSelf: "flex-start", backgroundColor: "#f2ffe9" },
  statusText: { color: colors.success, fontSize: 12, fontWeight: "900" },
  cardChevron: { marginLeft: spacing.xs },
  cardActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingLeft: 100 },
  outlineAction: { borderColor: colors.border, borderRadius: 28 },
  callAction: { borderRadius: 28, backgroundColor: "#e8ddf8" },
  actionContent: { minWidth: 96, minHeight: 42 }
});
