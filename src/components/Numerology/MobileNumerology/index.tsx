import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NumerologyCalculationTabs } from "@/components/Numerology/CalculationTabs";
import { NumerologyExportButton, NumerologyExportSection } from "@/components/Numerology/NumerologyExport";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { getMobileNumerology, MobileNumerologyPair, MobileNumerologyResponse } from "@/services/numerology.service";
import { translateUniqueTexts } from "@/services/translation.service";

import { localizeDigitsInText } from "../Lushu-grid/utils";

export function MobileNumerologyScreen() {
  const { language, t } = useTranslation();
  const params = useLocalSearchParams<{
    fullName?: string;
    dob?: string;
    gender?: string;
    mobileNumber?: string;
    personBFullName?: string;
    personBDob?: string;
    personBGender?: string;
  }>();
  const fullName = String(params.fullName || "");
  const dob = String(params.dob || "");
  const gender = String(params.gender || "Male");
  const mobileNumber = String(params.mobileNumber || "");
  const personBFullName = String(params.personBFullName || "");
  const personBDob = String(params.personBDob || "");
  const personBGender = String(params.personBGender || "Female");
  const [report, setReport] = useState<MobileNumerologyResponse | null>(null);
  const [translationMap, setTranslationMap] = useState<Map<string, string>>(new Map());
  const [translating, setTranslating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasMobileNumber = /^\d{10}$/.test(mobileNumber.trim());

  const payload = useMemo(
    () => ({ fullName, dateOfBirth: dob, mobileNumber }),
    [dob, fullName, mobileNumber]
  );

  useEffect(() => {
    let mounted = true;

    async function loadMobileNumerology() {
      if (!hasMobileNumber) {
        router.replace({
          pathname: "/astrologer/numerology",
          params: {
            fullName,
            dob,
            gender,
            calculation: "mobile-numerology",
            mobileNumber,
            personBFullName,
            personBDob,
            personBGender
          }
        });
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getMobileNumerology(payload);
        if (mounted) setReport(response);
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Unable to load mobile numerology"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMobileNumerology();
    return () => {
      mounted = false;
    };
  }, [dob, fullName, gender, hasMobileNumber, mobileNumber, payload, personBDob, personBFullName, personBGender]);

  useEffect(() => {
    let mounted = true;

    async function translateReport() {
      setTranslationMap(new Map());
      if (language === "en") {
        setTranslating(false);
        return;
      }

      try {
        setTranslating(true);
        const translated = await translateUniqueTexts(buildTranslationTexts(report), language);
        if (mounted) setTranslationMap(translated);
      } finally {
        if (mounted) setTranslating(false);
      }
    }

    translateReport();
    return () => {
      mounted = false;
    };
  }, [language, report]);

  if (loading) return <LoadingState label="Loading mobile numerology" />;
  if (error && !report) return <ErrorState message={error} onRetry={() => router.replace("/astrologer/numerology")} />;
  const tx = (text: string) => translationMap.get(text) || t(text);

  if (translating) return <LoadingState label={t("Translating...")} />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
        <Text variant="headlineSmall" style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{t("Numerology")}</Text>
        <LanguageSelector />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        <NumerologyCalculationTabs
          active="mobile-numerology"
          fullName={fullName}
          dob={dob}
          gender={gender}
          mobileNumber={mobileNumber}
          personBFullName={personBFullName}
          personBDob={personBDob}
          personBGender={personBGender}
        />

        <NumerologyExportButton
          title={`${tx("Mobile Numerology")} - ${fullName}`}
          fileName={`mobile-numerology-${fullName}`}
          sections={() => buildMobileNumerologyExportSections({ dob, fullName, language, mobileNumber, report, t })}
        />
        <SectionTitle title={tx("Mobile Numerology")} />
        <DetailsTable report={report} fallbackFullName={fullName} fallbackDob={dob} fallbackMobileNumber={mobileNumber} tx={tx} />
        <NumberCards report={report} tx={tx} />
        <SingleDigitCard value={report?.mobileTotal} tx={tx} />
        <RelationshipTable report={report} tx={tx} />
        <PairAnalysisTable pairs={report?.mobilePairs || []} tx={tx} />
        <LastDigitsTable report={report} tx={tx} />
        {error ? <Text style={styles.validation}>{error}</Text> : null}
      </ScrollView>
      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{title}</Text>
    </View>
  );
}

function DetailsTable({
  fallbackDob,
  fallbackFullName,
  fallbackMobileNumber,
  report,
  tx
}: {
  fallbackDob: string;
  fallbackFullName: string;
  fallbackMobileNumber: string;
  report: MobileNumerologyResponse | null;
  tx: (text: string) => string;
}) {
  const { language } = useTranslation();

  return (
    <View style={styles.infoTable}>
      <InfoRow label={tx("Name")} value={report?.fullName || fallbackFullName || "-"} />
      <InfoRow label={tx("DOB")} value={localizeDigitsInText(report?.dateOfBirth || fallbackDob || "-", language)} />
      <InfoRow label={tx("Mobile No.")} value={localizeDigitsInText(report?.mobileNumber || fallbackMobileNumber || "-", language)} last />
    </View>
  );
}

function NumberCards({ report, tx }: { report: MobileNumerologyResponse | null; tx: (text: string) => string }) {
  const { language } = useTranslation();
  const cards = [
    { label: tx("Personality Number"), value: report?.personalityNumber, note: `${tx("Compound")}: ${report?.mobileCompoundTotal ?? "-"}` },
    { label: tx("Destiny Number"), value: report?.destinyNumber, note: `${tx("Lo Shu Grid")}: ${report?.destinyNumber ?? "-"}` },
    { label: tx("Name Number"), value: report?.nameNumber, note: `${tx("Compound")}: ${report?.compoundNameNumber ?? "-"}` },
    { label: tx("Zodiac"), value: report?.zodiacNumber, note: report?.normalizedName || "-" }
  ];

  return (
    <View style={styles.numberGrid}>
      {cards.map((card) => (
        <View key={card.label} style={styles.numberCard}>
          <Text style={styles.numberCardLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.66}>{card.label}</Text>
          <Text style={styles.numberCardValue}>{localizeDigitsInText(card.value ?? "-", language)}</Text>
          <Text style={styles.numberCardNote} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.62}>
            {localizeDigitsInText(card.note, language)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SingleDigitCard({ tx, value }: { tx: (text: string) => string; value?: number }) {
  const { language } = useTranslation();
  return (
    <View style={styles.singleDigitCard}>
      <Text style={styles.singleDigitLabel}>{tx("MT : Mobile Number Single Digit Sum")}</Text>
      <Text style={styles.singleDigitValue}>{localizeDigitsInText(value ?? "-", language)}</Text>
    </View>
  );
}

function RelationshipTable({ report, tx }: { report: MobileNumerologyResponse | null; tx: (text: string) => string }) {
  const { language } = useTranslation();
  const mt = report?.mobileTotal ?? "-";
  const rows = [
    { label: "Personality to MT", source: report?.personalityNumber, relation: report?.mobileRetaionship?.personalitytoMT },
    { label: "Destiny to MT", source: report?.destinyNumber, relation: report?.mobileRetaionship?.destinytoMT },
    { label: "Name Number to MT", source: report?.nameNumber, relation: report?.mobileRetaionship?.nameNoToMT },
    { label: "Zodiac to MT", source: report?.zodiacNumber, relation: report?.mobileRetaionship?.zodiacToMT }
  ];

  return (
    <View style={styles.panel}>
      <SectionTitle title={tx("Relationship with MT")} />
      <View style={styles.table}>
        <TableRow cells={[tx("Particular"), tx("Number"), tx("Relation")]} header />
        {rows.map((row) => (
          <TableRow
            key={row.label}
            cells={[
              tx(row.label),
              localizeDigitsInText(`${row.source ?? "-"} - ${mt}`, language),
              tx(formatRelation(row.relation))
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function PairAnalysisTable({ pairs, tx }: { pairs: MobileNumerologyPair[]; tx: (text: string) => string }) {
  const { language } = useTranslation();

  return (
    <View style={styles.panel}>
      <SectionTitle title={tx("Pair Analysis in Mobile Number")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.pairTable}>
          <TableRow cells={[tx("Pair"), tx("Vibration"), tx("Traits")]} header />
          {pairs.map((pair, index) => (
            <TableRow
              key={`${pair.position || index}-${pair.originalPair || pair.calculatedPair || index}`}
              cells={[
                localizeDigitsInText(pair.calculatedPair || pair.originalPair || "-", language),
                pair.vibration ? tx(pair.vibration) : "-",
                pair.coreTraits ? tx(pair.coreTraits) : "-"
              ]}
              large
            />
          ))}
          {!pairs.length ? <TableRow cells={[tx("No records found"), "", ""]} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}

function LastDigitsTable({ report, tx }: { report: MobileNumerologyResponse | null; tx: (text: string) => string }) {
  const { language } = useTranslation();
  const digits = report?.mobileLastPairDigitsDto;
  const rows = [
    { label: tx("Fourth Last (Identity)"), value: digits?.fourthLastDigitFromPairList },
    { label: tx("Third Last (Expression)"), value: digits?.thirdLastDigitFromPairList },
    { label: tx("Second Last (Expectation)"), value: digits?.secondLastDigitFromPairList },
    { label: tx("Last (Manifestation)"), value: digits?.lastDigitFromPairList }
  ];

  return (
    <View style={styles.panel}>
      <SectionTitle title={tx("Last Four Digits Analysis")} />
      <View style={styles.table}>
        <TableRow cells={[tx("Placement"), tx("Number")]} header />
        {rows.map((row) => (
          <TableRow key={row.label} cells={[row.label, localizeDigitsInText(row.value ?? "-", language)]} />
        ))}
      </View>
    </View>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.lastRow]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.66}>{value}</Text>
    </View>
  );
}

function TableRow({ cells, header = false, large = false }: { cells: (string | number)[]; header?: boolean; large?: boolean }) {
  return (
    <View style={[styles.tableRow, large && styles.largeTableRow]}>
      {cells.map((cell, index) => (
        <Text
          key={`${cell}-${index}`}
          style={[
            styles.tableCell,
            header && styles.tableHeadCell,
            large && styles.largeTableCell,
            index === 2 && styles.traitsCell,
            index === cells.length - 1 && styles.lastCell
          ]}
          numberOfLines={large && index === 2 ? 6 : 2}
          adjustsFontSizeToFit
          minimumFontScale={0.58}
        >
          {cell}
        </Text>
      ))}
    </View>
  );
}

function formatRelation(value?: string) {
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function buildTranslationTexts(report: MobileNumerologyResponse | null) {
  return [
    "Mobile Numerology",
    "Name",
    "DOB",
    "Mobile No.",
    "Personality Number",
    "Destiny Number",
    "Name Number",
    "Zodiac",
    "Compound",
    "Lo Shu Grid",
    "MT : Mobile Number Single Digit Sum",
    "Relationship with MT",
    "Particular",
    "Number",
    "Relation",
    "Personality to MT",
    "Destiny to MT",
    "Name Number to MT",
    "Zodiac to MT",
    "Pair Analysis in Mobile Number",
    "Pair",
    "Vibration",
    "Traits",
    "No records found",
    "Last Four Digits Analysis",
    "Placement",
    "Fourth Last (Identity)",
    "Third Last (Expression)",
    "Second Last (Expectation)",
    "Last (Manifestation)",
    "Mobile Summary",
    "Mobile Total",
    "Mobile Compound Total",
    "Normalized Name",
    ...[
      report?.mobileRetaionship?.personalitytoMT,
      report?.mobileRetaionship?.destinytoMT,
      report?.mobileRetaionship?.nameNoToMT,
      report?.mobileRetaionship?.zodiacToMT
    ].map(formatRelation),
    ...(report?.mobilePairs || []).flatMap((pair) => [
      pair.vibration || "",
      pair.coreTraits || ""
    ])
  ].filter((text) => text.trim());
}

async function buildMobileNumerologyExportSections({
  dob,
  fullName,
  language,
  mobileNumber,
  report,
  t
}: {
  dob: string;
  fullName: string;
  language: ReturnType<typeof useTranslation>["language"];
  mobileNumber: string;
  report: MobileNumerologyResponse | null;
  t: ReturnType<typeof useTranslation>["t"];
}): Promise<NumerologyExportSection[]> {
  const translationMap = await translateUniqueTexts(buildTranslationTexts(report), language);
  const tx = (text: string) => translationMap.get(text) || t(text);
  const relationRows = [
    { label: "Personality to MT", source: report?.personalityNumber, relation: report?.mobileRetaionship?.personalitytoMT },
    { label: "Destiny to MT", source: report?.destinyNumber, relation: report?.mobileRetaionship?.destinytoMT },
    { label: "Name Number to MT", source: report?.nameNumber, relation: report?.mobileRetaionship?.nameNoToMT },
    { label: "Zodiac to MT", source: report?.zodiacNumber, relation: report?.mobileRetaionship?.zodiacToMT }
  ];
  const digits = report?.mobileLastPairDigitsDto;
  const lastDigitRows = [
    { label: "Fourth Last (Identity)", value: digits?.fourthLastDigitFromPairList },
    { label: "Third Last (Expression)", value: digits?.thirdLastDigitFromPairList },
    { label: "Second Last (Expectation)", value: digits?.secondLastDigitFromPairList },
    { label: "Last (Manifestation)", value: digits?.lastDigitFromPairList }
  ];
  const pairs = report?.mobilePairs || [];

  return [
    {
      title: tx("Mobile Numerology"),
      rows: [
        [tx("Name"), report?.fullName || fullName || "-"],
        [tx("DOB"), localizeDigitsInText(report?.dateOfBirth || dob || "-", language)],
        [tx("Mobile No."), localizeDigitsInText(report?.mobileNumber || mobileNumber || "-", language)],
        [tx("Normalized Name"), report?.normalizedName || "-"]
      ]
    },
    {
      title: tx("Mobile Summary"),
      variant: "summary",
      rows: [
        [tx("Personality Number"), localizeDigitsInText(report?.personalityNumber ?? "-", language), tx("Compound"), localizeDigitsInText(report?.mobileCompoundTotal ?? "-", language)],
        [tx("Destiny Number"), localizeDigitsInText(report?.destinyNumber ?? "-", language), "", ""],
        [tx("Name Number"), localizeDigitsInText(report?.nameNumber ?? "-", language), tx("Compound"), localizeDigitsInText(report?.compoundNameNumber ?? "-", language)],
        [tx("Zodiac"), localizeDigitsInText(report?.zodiacNumber ?? "-", language), "", ""],
        [tx("Mobile Total"), localizeDigitsInText(report?.mobileTotal ?? "-", language), tx("Mobile Compound Total"), localizeDigitsInText(report?.mobileCompoundTotal ?? "-", language)]
      ]
    },
    {
      title: tx("Relationship with MT"),
      rows: [
        [tx("Particular"), tx("Number"), tx("Relation")],
        ...relationRows.map((row) => [
          tx(row.label),
          localizeDigitsInText(`${row.source ?? "-"} - ${report?.mobileTotal ?? "-"}`, language),
          tx(formatRelation(row.relation))
        ])
      ]
    },
    {
      title: tx("Pair Analysis in Mobile Number"),
      layout: "wide",
      rows: [
        [tx("Pair"), tx("Vibration"), tx("Traits")],
        ...pairs.map((pair) => [
          localizeDigitsInText(pair.calculatedPair || pair.originalPair || "-", language),
          pair.vibration ? tx(pair.vibration) : "-",
          pair.coreTraits ? tx(pair.coreTraits) : "-"
        ]),
        ...(!pairs.length ? [[tx("No records found"), "", ""]] : [])
      ]
    },
    {
      title: tx("Last Four Digits Analysis"),
      rows: [
        [tx("Placement"), tx("Number")],
        ...lastDigitRows.map((row) => [
          tx(row.label),
          localizeDigitsInText(row.value ?? "-", language)
        ])
      ]
    }
  ];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    gap: spacing.sm
  },
  headerTitle: { flex: 1, minWidth: 0, color: colors.ink, fontWeight: "700", fontSize: 12, lineHeight: 19, textAlign: "center" },
  scroll: { flex: 1 },
  content: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 420,
    minHeight: "100%",
    backgroundColor: "#fff",
    padding: spacing.lg,
    paddingBottom: 104,
    gap: spacing.md
  },
  sectionTitle: {
    alignSelf: "center",
    width: "100%",
    minHeight: 40,
    borderWidth: 1,
    borderColor: "#39a853",
    borderRadius: 5,
    backgroundColor: "#bff2c6",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    // paddingVertical: 8
  },
  sectionTitleText: {
    width: "100%",
    color: "#145c24",
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "900",
    textAlign: "left",
    writingDirection: "ltr",
    includeFontPadding: true
  },
  infoTable: {
    borderWidth: 1,
    borderColor: "#d7d7d7",
    borderRadius: 6,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#777",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  infoRow: { minHeight: 35, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#d7d7d7" },
  lastRow: { borderBottomWidth: 0 },
  infoLabel: { flex: 1, borderRightWidth: 1, borderRightColor: "#d7d7d7", color: "#000", fontSize: 12, lineHeight: 15, fontWeight: "900", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 5, paddingVertical: 5 },
  infoValue: { flex: 1.45, color: "#000", fontSize: 12, lineHeight: 15, fontWeight: "700", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 5, paddingVertical: 5 },
  numberGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  numberCard: {
    width: "48.5%",
    minHeight: 92,
    borderRadius: 6,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
    shadowColor: "#777",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 3
  },
  numberCardLabel: { color: "#000", fontSize: 11, lineHeight: 14, fontWeight: "800", textAlign: "center" },
  numberCardValue: { color: "#000", fontSize: 24, lineHeight: 29, fontWeight: "900", textAlign: "center", marginTop: 3 },
  numberCardNote: { color: "#000", fontSize: 9, lineHeight: 12, fontWeight: "600", textAlign: "center", marginTop: 2 },
  singleDigitCard: {
    minHeight: 56,
    borderRadius: 6,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: "#777",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 3
  },
  singleDigitLabel: { color: "#000", fontSize: 12, lineHeight: 15, fontWeight: "800", textAlign: "center" },
  singleDigitValue: { color: "#000", fontSize: 22, lineHeight: 27, fontWeight: "900", textAlign: "center" },
  panel: {
    gap: spacing.sm,
    borderRadius: 6,
    backgroundColor: "#fff",
    padding: spacing.sm,
    shadowColor: "#777",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 3
  },
  table: { borderWidth: 1, borderColor: "#d7d7d7", borderRadius: 5, backgroundColor: "#fff", overflow: "hidden" },
  pairTable: { width: 520, borderWidth: 1, borderColor: "#d7d7d7", borderRadius: 5, backgroundColor: "#fff", overflow: "hidden" },
  tableRow: { minHeight: 34, flexDirection: "row" },
  largeTableRow: { minHeight: 78 },
  tableCell: { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d7d7d7", color: "#000", fontSize: 12, lineHeight: 15, fontWeight: "700", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 4, paddingVertical: 5 },
  tableHeadCell: { backgroundColor: "#fff", color: "#000", fontSize: 12, lineHeight: 15, fontWeight: "900" },
  largeTableCell: { fontSize: 11, lineHeight: 14, fontWeight: "700" },
  traitsCell: { flex: 2.65, textAlign: "left" },
  lastCell: { borderRightWidth: 0 },
  validation: { color: colors.danger, fontSize: 12, fontWeight: "800", lineHeight: 17 }
});
