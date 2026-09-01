import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";

import { Calculation } from "./Lushu-grid/constants";

type NumerologyCalculationTab = {
  label: string;
  value: Calculation;
  pathname: string;
};

const calculationTabs: NumerologyCalculationTab[] = [
  { label: "Lo Shu Grid", value: "lo-shu-grid", pathname: "/astrologer/numerology-result" },
  { label: "Vedic Grid", value: "vedic-grid", pathname: "/astrologer/vedic-grid" },
  { label: "Pythagoras Grid", value: "pythagoras-grid", pathname: "/astrologer/pythagoras-grid" },
  { label: "Name Frequency", value: "name-frequency", pathname: "/astrologer/name-frequency" },
  { label: "Compatibility/Relationship", value: "compatibility-relationship", pathname: "/astrologer/compatibility-relationship" },
  { label: "Daily Numeroscope", value: "daily-numeroscope", pathname: "/astrologer/numerology" }
];

export function NumerologyCalculationTabs({
  active,
  dob,
  fullName,
  gender,
  personBDob = "",
  personBFullName = "",
  personBGender = "Female"
}: {
  active: Calculation;
  dob: string;
  fullName: string;
  gender: string;
  personBDob?: string;
  personBFullName?: string;
  personBGender?: string;
}) {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const activeIndex = calculationTabs.findIndex((tab) => tab.value === active);

  useEffect(() => {
    const tabWidth = 112;
    const tabGap = 8;
    const stripWidth = Math.min(width, 420) - spacing.lg * 2;
    const activeCenter = activeIndex * (tabWidth + tabGap) + tabWidth / 2;
    const offset = Math.max(0, activeCenter - stripWidth / 2);
    const timeout = setTimeout(() => scrollRef.current?.scrollTo({ x: offset, animated: true }), 80);

    return () => clearTimeout(timeout);
  }, [activeIndex, width]);

  return (
    <View style={styles.stickyWrap}>
      <View style={styles.detailsRow}>
        <View style={styles.detailsCopy}>
          <Text style={styles.fullName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {fullName || "-"}
          </Text>
          <Text style={styles.metaText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {dob || "-"}  |  {t(gender || "-")}
          </Text>
        </View>
        <Pressable
          style={styles.editButton}
          onPress={() => {
            router.push({
              pathname: "/astrologer/numerology",
              params: { fullName, dob, gender, calculation: active, personBFullName, personBDob, personBGender }
            });
          }}
        >
          <MaterialCommunityIcons name="pencil" size={18} color="#145c24" />
        </Pressable>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {calculationTabs.map((tab) => {
          const activeTab = tab.value === active;
          return (
            <Pressable
              key={tab.value}
              style={[styles.tab, activeTab && styles.activeTab]}
              onPress={() => {
                if (activeTab) return;
                router.push({
                  pathname: tab.pathname,
                  params: { fullName, dob, gender, calculation: tab.value, personBFullName, personBDob, personBGender }
                });
              }}
            >
              <Text
                style={[styles.tabText, activeTab && styles.activeTabText]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {t(tab.label)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  stickyWrap: {
    marginHorizontal: -spacing.lg,
    borderRadius: 0,
    backgroundColor: "#fff",
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    gap: 7,
    shadowColor: "#0d3440",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 20
  },
  detailsRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#eef0e8"
  },
  detailsCopy: {
    flex: 1,
    minWidth: 0
  },
  fullName: {
    color: "#111",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900"
  },
  metaText: {
    color: "#5f665d",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 1
  },
  editButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#bde8c2",
    backgroundColor: "#f8fff6",
    alignItems: "center",
    justifyContent: "center"
  },
  tabs: {
    minHeight: 44,
    alignItems: "center",
    gap: spacing.sm,
    paddingRight: spacing.sm
  },
  tab: {
    minWidth: 112,
    minHeight: 38,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5
  },
  activeTab: {
    borderColor: "#34a853",
    backgroundColor: "#bff2c6"
  },
  tabText: {
    width: "100%",
    color: "#424242",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    textAlign: "center"
  },
  activeTabText: {
    color: "#145c24"
  }
});
