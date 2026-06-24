import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Avatar, Button, Chip, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useAstrologers } from "@/hooks/useAstrologers";
import { Astrologer } from "@/types/api";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;
type ExpFilter = "All Experience" | "0 - 5 Years" | "6 - 10 Years" | "11+ Years";

const expFilters: ExpFilter[] = ["All Experience", "0 - 5 Years", "6 - 10 Years", "11+ Years"];

function splitValues(value?: string | string[]) {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return (value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function getName(astrologer: Astrologer) {
  return astrologer.displayName || astrologer.fullName || [astrologer.firstName, astrologer.lastName].filter(Boolean).join(" ") || "Apsara Expert";
}

function getSkills(astrologer: Astrologer) {
  return splitValues(astrologer.expertise).join(", ") || astrologer.specialization || "Astrology";
}

function getExperience(astrologer: Astrologer) {
  const value = Number(astrologer.yearsOfExperience || 0);
  return Number.isFinite(value) ? value : 0;
}

function matchesExperience(astrologer: Astrologer, filter: ExpFilter) {
  const years = getExperience(astrologer);
  if (filter === "All Experience") return true;
  if (filter === "0 - 5 Years") return years <= 5;
  if (filter === "6 - 10 Years") return years >= 6 && years <= 10;
  return years >= 11;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function AstrologerListScreen() {
  const query = useAstrologers();
  const [category, setCategory] = useState("All");
  const [language, setLanguage] = useState("All");
  const [location, setLocation] = useState("All");
  const [experience, setExperience] = useState<ExpFilter>("All Experience");

  const data = query.data || [];
  const categories = useMemo(() => unique(data.flatMap((item) => [item.specialization || "", ...splitValues(item.expertise)])), [data]);
  const languages = useMemo(() => unique(data.flatMap((item) => splitValues(item.language || item.languagesKnown))), [data]);
  const locations = useMemo(() => unique(data.map((item) => item.city || item.state || "").filter(Boolean)), [data]);

  const filtered = useMemo(() => data.filter((item) => {
    const skillText = [item.specialization || "", ...splitValues(item.expertise)].join(" ").toLowerCase();
    const languageText = splitValues(item.language || item.languagesKnown).join(" ").toLowerCase();
    const locationText = [item.city, item.state].filter(Boolean).join(" ").toLowerCase();

    return (
      (category === "All" || skillText.includes(category.toLowerCase())) &&
      (language === "All" || languageText.includes(language.toLowerCase())) &&
      (location === "All" || locationText.includes(location.toLowerCase())) &&
      matchesExperience(item, experience)
    );
  }), [category, data, experience, language, location]);

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
              <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>Back</Button>
              <Text variant="titleLarge" style={styles.title}>Astrologers</Text>
              <View style={styles.headerGap} />
            </View>
            <View style={styles.filterPanel}>
              <FilterGroup title="Category" options={["All", ...categories.slice(0, 8)]} selected={category} onSelect={setCategory} />
              <FilterGroup title="Language" options={["All", ...languages.slice(0, 8)]} selected={language} onSelect={setLanguage} />
              <FilterGroup title="Location" options={["All", ...locations.slice(0, 8)]} selected={location} onSelect={setLocation} />
              <FilterGroup title="Experience" options={expFilters} selected={experience} onSelect={(value) => setExperience(value as ExpFilter)} />
            </View>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>{filtered.length} astrologer{filtered.length === 1 ? "" : "s"}</Text>
              <Text style={styles.resultMuted}>Showing matching experts</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<EmptyState title="No astrologers found" description="Try changing the filters." />}
      />
      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}

function FilterGroup({ title, options, selected, onSelect }: { title: string; options: string[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{title.toUpperCase()}</Text>
      <View style={styles.chips}>
        {options.map((item) => {
          const active = item === selected;
          return (
            <Chip
              key={`${title}-${item}`}
              compact
              selected={active}
              onPress={() => onSelect(item)}
              style={[styles.chip, active && styles.activeChip]}
              textStyle={[styles.chipText, active && styles.activeChipText]}
            >
              {item}
            </Chip>
          );
        })}
      </View>
    </View>
  );
}

function AstrologerResultCard({ astrologer }: { astrologer: Astrologer }) {
  const name = getName(astrologer);
  const skills = getSkills(astrologer);
  const years = astrologer.yearsOfExperience || "5";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/astrologers/${astrologer.publicId}`)}>
      <View style={styles.cardTop}>
        <View style={styles.avatarWrap}>
          <Avatar.Text size={72} label={initials || "AA"} style={styles.avatar} labelStyle={styles.avatarLabel} />
          <View style={[styles.onlineDot, { backgroundColor: astrologer.isOnline === false ? "#9a9a9a" : colors.success }]} />
        </View>
        <View style={styles.cardInfo}>
          <Text variant="titleLarge" numberOfLines={1} style={styles.cardName}>{name}</Text>
          <Text style={styles.cardMeta} numberOfLines={2}>{years}+ years • {skills}</Text>
          <Chip compact icon="currency-inr" style={styles.priceChip} textStyle={styles.priceText}>₹{astrologer.pricePerMinute || 25}/min</Chip>
        </View>
      </View>
      <View style={styles.cardActions}>
        <Button mode="outlined" icon="chat" textColor={colors.amber} style={styles.outlineAction} onPress={() => router.push("/chat")}>Chat</Button>
        <Button mode="contained-tonal" icon="phone" style={styles.callAction} onPress={() => router.push("/call")}>Call</Button>
        <Button mode="text" compact onPress={() => router.push(`/astrologers/${astrologer.publicId}`)}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.amber} />
        </Button>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f7f7" },
  list: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 92, gap: spacing.md },
  top: { gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.ink, fontWeight: "700",fontSize: 15 },
  headerGap: { width: 70 },
  filterPanel: { borderWidth: 1, borderColor: "#d4bd22", borderRadius: 12, backgroundColor: "#ffffc9", padding: spacing.md, gap: spacing.md },
  filterGroup: { gap: spacing.xs },
  filterLabel: { color: colors.amber, fontSize: 10, fontWeight: "900", letterSpacing: 0 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { backgroundColor: "#fffde6", borderWidth: 1, borderColor: "#d4bd22" },
  activeChip: { backgroundColor: "#c5a500" },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: "700" },
  activeChipText: { color: "#111", fontWeight: "900" },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultTitle: { color: colors.ink, fontWeight: "900" },
  resultMuted: { color: colors.cocoa, fontSize: 12 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.md },
  cardTop: { flexDirection: "row", gap: spacing.md },
  avatarWrap: { width: 88, alignItems: "center" },
  avatar: { backgroundColor: colors.ink },
  avatarLabel: { color: colors.lime, fontSize: 24, fontWeight: "800" },
  onlineDot: { width: 14, height: 14, borderRadius: 7, marginTop: spacing.md },
  cardInfo: { flex: 1, gap: spacing.sm },
  cardName: { color: colors.ink, fontWeight: "900" },
  cardMeta: { color: colors.cocoa, lineHeight: 21 },
  priceChip: { alignSelf: "flex-start", backgroundColor: "#e8ddf8" },
  priceText: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  cardActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  outlineAction: { borderColor: colors.border, borderRadius: 28 },
  callAction: { borderRadius: 28, backgroundColor: "#e8ddf8" }
});
