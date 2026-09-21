import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Chip, Text } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { Astrologer } from "@/types/api";

export type ExperienceFilter = "All Experience" | "0 - 5 Years" | "6 - 10 Years" | "11+ Years";

export type AstrologerFilterState = {
  category: string;
  language: string;
  location: string;
  experience: ExperienceFilter;
};

export const defaultAstrologerFilters: AstrologerFilterState = {
  category: "All",
  language: "All",
  location: "All",
  experience: "All Experience"
};

const experienceFilters: ExperienceFilter[] = ["All Experience", "0 - 5 Years", "6 - 10 Years", "11+ Years"];

export function splitAstrologerValues(value?: string | string[]) {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return (value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

export function getAstrologerLanguages(astrologer: Astrologer) {
  const languages = splitAstrologerValues(astrologer.language || astrologer.languagesKnown);
  return languages.length ? languages : ["Hindi", "English"];
}

export function getAstrologerRouteId(astrologer: Astrologer) {
  return encodeURIComponent(astrologer.publicId || astrologer.userId || astrologer.email || "");
}

export function getActiveAstrologerFilterCount(filters: AstrologerFilterState) {
  return [
    filters.category !== defaultAstrologerFilters.category,
    filters.language !== defaultAstrologerFilters.language,
    filters.location !== defaultAstrologerFilters.location,
    filters.experience !== defaultAstrologerFilters.experience
  ].filter(Boolean).length;
}

export function getAstrologerFilterOptions(data: Astrologer[]) {
  return {
    categories: unique(data.flatMap((item) => [item.specialization || "", ...splitAstrologerValues(item.expertise)])),
    languages: unique(data.flatMap(getAstrologerLanguages)),
    locations: unique(data.map((item) => item.city || item.state || "").filter(Boolean))
  };
}

export function filterAstrologers(data: Astrologer[], filters: AstrologerFilterState) {
  return data.filter((item) => {
    const skillText = [item.specialization || "", ...splitAstrologerValues(item.expertise)].join(" ").toLowerCase();
    const languageText = getAstrologerLanguages(item).join(" ").toLowerCase();
    const locationText = [item.city, item.state].filter(Boolean).join(" ").toLowerCase();

    return (
      (filters.category === "All" || skillText.includes(filters.category.toLowerCase())) &&
      (filters.language === "All" || languageText.includes(filters.language.toLowerCase())) &&
      (filters.location === "All" || locationText.includes(filters.location.toLowerCase())) &&
      matchesExperience(item, filters.experience)
    );
  });
}

export function AstrologerFilterModal({
  filters,
  onChange,
  onClose,
  options,
  visible
}: {
  filters: AstrologerFilterState;
  onChange: (filters: AstrologerFilterState) => void;
  onClose: () => void;
  options: ReturnType<typeof getAstrologerFilterOptions>;
  visible: boolean;
}) {
  const { t } = useTranslation();
  const activeFilterCount = getActiveAstrologerFilterCount(filters);
  const update = (patch: Partial<AstrologerFilterState>) => onChange({ ...filters, ...patch });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="tune-variant" size={20} color={colors.amber} />
              <Text style={styles.sheetTitle}>{t("Filters")}</Text>
            </View>
            <Button mode="text" compact onPress={onClose}>{t("Done")}</Button>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            <FilterGroup title="Category" options={["All", ...options.categories.slice(0, 8)]} selected={filters.category} onSelect={(category) => update({ category })} />
            <FilterGroup title="Language" options={["All", ...options.languages.slice(0, 8)]} selected={filters.language} onSelect={(language) => update({ language })} />
            <FilterGroup title="Location" options={["All", ...options.locations.slice(0, 8)]} selected={filters.location} onSelect={(location) => update({ location })} />
            <FilterGroup title="Experience" options={experienceFilters} selected={filters.experience} onSelect={(experience) => update({ experience: experience as ExperienceFilter })} />
          </ScrollView>
          <View style={styles.footer}>
            <Button mode="outlined" disabled={!activeFilterCount} onPress={() => onChange(defaultAstrologerFilters)} style={styles.footerButton}>
              {t("Clear")}
            </Button>
            <Button mode="contained" onPress={onClose} style={styles.footerButton}>
              {t("Apply")}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterGroup({ title, options, selected, onSelect }: { title: string; options: string[]; selected: string; onSelect: (value: string) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{t(title).toUpperCase()}</Text>
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
              {t(item)}
            </Chip>
          );
        })}
      </View>
    </View>
  );
}

function matchesExperience(astrologer: Astrologer, filter: ExperienceFilter) {
  const years = Number(astrologer.yearsOfExperience || 0);
  const safeYears = Number.isFinite(years) ? years : 0;
  if (filter === "All Experience") return true;
  if (filter === "0 - 5 Years") return safeYears <= 5;
  if (filter === "6 - 10 Years") return safeYears >= 6 && safeYears <= 10;
  return safeYears >= 11;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(33,23,4,0.38)" },
  sheet: {
    maxHeight: "82%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: "#fffbd8",
    borderWidth: 1,
    borderColor: "#d4bd22",
    padding: spacing.md,
    gap: spacing.sm
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  sheetTitle: { color: colors.ink, fontSize: 18, lineHeight: 23, fontWeight: "900" },
  sheetContent: { gap: spacing.md, paddingVertical: spacing.sm },
  filterGroup: { gap: spacing.xs },
  filterLabel: { color: colors.amber, fontSize: 11, lineHeight: 14, fontWeight: "900", letterSpacing: 0 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { minHeight: 36, backgroundColor: "#fffef0", borderWidth: 1, borderColor: "#d4bd22", borderRadius: 20 },
  activeChip: { backgroundColor: "#c5a500" },
  chipText: { color: colors.ink, fontSize: 13, lineHeight: 17, fontWeight: "800" },
  activeChipText: { color: "#111", fontWeight: "900" },
  footer: { flexDirection: "row", gap: spacing.sm, paddingTop: spacing.sm },
  footerButton: { flex: 1, borderRadius: 28 }
});
