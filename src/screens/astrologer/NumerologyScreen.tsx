import { useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import {
  getLoShuGrid,
  getPersonalYear,
  getPersonalYearMatrix,
  LoShuGridResponse,
  PersonalYearMatrixItem,
  PersonalYearResponse
} from "@/services/numerology.service";
import { getApiErrorMessage } from "@/services/apiClient";

type Gender = "Male" | "Female" | "Other";
type Calculation = "lo-shu-grid" | "vedic-grid" | "pythagoras-grid" | "name-frequency" | "daily-numeroscope";

const months = [
  ["Jan", "January", 1],
  ["Feb", "February", 2],
  ["Mar", "March", 3],
  ["Apr", "April", 4],
  ["May", "May", 5],
  ["Jun", "June", 6],
  ["Jul", "July", 7],
  ["Aug", "August", 8],
  ["Sep", "September", 9],
  ["Oct", "October", 10],
  ["Nov", "November", 11],
  ["Dec", "December", 12]
] as const;
const calculationOptions: { label: string; value: Calculation }[] = [
  { label: "Lo Shu Grid", value: "lo-shu-grid" },
  { label: "Vedic Grid", value: "vedic-grid" },
  { label: "Pythagoras Grid", value: "pythagoras-grid" },
  { label: "Name Frequency", value: "name-frequency" },
  { label: "Daily Numeroscope", value: "daily-numeroscope" }
];
const defaultGrid = {
  topRow: ["4", "9", "2"],
  middleRow: ["3", "5", "7"],
  bottomRow: ["8", "1", "6"]
};
const advice = [
  ["briefcase", "Career", "#37c653", "Good in education, Banking & Finance."],
  ["heart-pulse", "Health", "#ff1616", "Health problem with age."],
  ["cash", "Finance", "#4d9bff", "Earn good money specially after age of 35 years."],
  ["heart-broken", "Relationship", "#ff43b2", "Average relationship, emotional distance possible."]
] as const;
const relationRows = [
  ["Personality", "5", "1,6", "2", "3,4,5,7,8,9"],
  ["Destiny", "9", "1,3,7", "4,5", "2,6,8,9"]
];
const personalYearNotes = [
  "Your running personal year shows where effort and results will concentrate.",
  "This year rewards consistent hard work and practical planning.",
  "A favourable time to buy, sell, or recover pending funds.",
  "Avoid business expansion until the existing venture is stronger.",
  "Useful connections may be established through focused communication."
];
const minimumDobDate = new Date(1900, 0, 1);

export function NumerologyScreen() {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [calculation, setCalculation] = useState<Calculation>("lo-shu-grid");
  const [calculationOpen, setCalculationOpen] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/astrologer");
      return true;
    });

    return () => subscription.remove();
  }, []);

  const canSubmit =
    fullName.trim().length > 1 &&
    /^\d{2}-\d{2}-\d{4}$/.test(dob.trim()) &&
    gender &&
    calculation === "lo-shu-grid";

  const submit = () => {
    setSubmitted(true);
    setCalculationOpen(false);
    if (!canSubmit) return;
    router.push({
      pathname: "/astrologer/numerology-result",
      params: { fullName: fullName.trim(), dob: dob.trim(), gender, calculation }
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.replace("/astrologer")}>Back</Button>
        <Text variant="headlineSmall" style={styles.headerTitle}>Numerology</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <View style={styles.formStack}>
            <FieldIcon icon="account" />
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              placeholderTextColor="#9c9c9c"
              style={styles.input}
            />
          </View>
          <View style={styles.formStack}>
            <FieldIcon icon="calendar-month" />
            <Pressable style={styles.dateSelect} onPress={() => setShowDobPicker(true)}>
              <Text style={[styles.dateSelectText, !dob && styles.placeholderText]}>{dob || "Date of Birth (DD-MM-YYYY)"}</Text>
            </Pressable>
          </View>
          {showDobPicker ? (
            <DateTimePicker
              value={parseDob(dob) || new Date(1990, 0, 1)}
              mode="date"
              minimumDate={minimumDobDate}
              maximumDate={new Date()}
              onChange={(_, selectedDate) => {
                setShowDobPicker(false);
                if (selectedDate) {
                  setDob(formatDob(selectedDate));
                }
              }}
            />
          ) : null}
          <View style={styles.genderRow}>
            {(["Male", "Female", "Other"] as Gender[]).map((item) => (
              <Pressable key={item} onPress={() => setGender(item)} style={[styles.genderBtn, gender === item && styles.genderBtnActive]}>
                <Text style={[styles.genderText, gender === item && styles.genderTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.formStack}>
            <FieldIcon icon="arrow-down-circle" />
            <View style={styles.calculationSelect}>
              <Pressable style={styles.calculationTrigger} onPress={() => setCalculationOpen((open) => !open)}>
                <Text style={styles.calculationValue}>{calculationOptions.find((item) => item.value === calculation)?.label}</Text>
                <MaterialCommunityIcons name={calculationOpen ? "chevron-up" : "chevron-down"} size={22} color="#111" />
              </Pressable>
              {calculationOpen ? (
                <View style={styles.calculationMenu}>
                  {calculationOptions.map((item) => (
                    <Pressable
                      key={item.value}
                      style={[styles.calculationOption, calculation === item.value && styles.calculationOptionActive]}
                      onPress={() => {
                        setCalculation(item.value);
                        setCalculationOpen(false);
                      }}
                    >
                      <Text style={[styles.calculationOptionText, calculation === item.value && styles.calculationOptionTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
          {submitted && !canSubmit ? (
            <Text style={styles.validation}>
              {calculation !== "lo-shu-grid" ? "Please select Lo Shu Grid calculation." : "Enter full name, DOB, and gender."}
            </Text>
          ) : null}
          <Pressable style={styles.submitBtn} onPress={submit}>
            <Text style={styles.submitText}>Submit</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}

function formatDob(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function parseDob(value: string) {
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function NumerologyResultScreen() {
  const params = useLocalSearchParams<{ fullName?: string; dob?: string; gender?: string }>();
  const fullName = String(params.fullName || "");
  const dob = String(params.dob || "");
  const gender = String(params.gender || "Male");
  const currentYear = new Date().getFullYear();
  const [loShu, setLoShu] = useState<LoShuGridResponse | null>(null);
  const [personalYear, setPersonalYear] = useState<PersonalYearResponse | null>(null);
  const [matrix, setMatrix] = useState<PersonalYearMatrixItem[]>([]);
  const [fromYear, setFromYear] = useState(String(currentYear));
  const [toYear, setToYear] = useState(String(currentYear + 10));
  const [loading, setLoading] = useState(true);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => ({ dob, fullName, gender }), [dob, fullName, gender]);

  useEffect(() => {
    let mounted = true;
    async function loadReport() {
      try {
        setLoading(true);
        setError(null);
        const grid = await getLoShuGrid(payload);
        if (!mounted) return;
        setLoShu(grid);
        const year = await getPersonalYear(payload);
        if (!mounted) return;
        setPersonalYear(year);
        const yearMatrix = await getPersonalYearMatrix(dob, currentYear, currentYear + 10);
        if (!mounted) return;
        setMatrix(yearMatrix);
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Unable to load numerology report"));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadReport();
    return () => {
      mounted = false;
    };
  }, [currentYear, dob, payload]);

  const refreshMatrix = async () => {
    const from = Number(fromYear);
    const to = Number(toYear);
    if (!Number.isInteger(from) || !Number.isInteger(to) || to < from || to - from > 10) {
      setError("From Year and To Year must be valid, with a maximum 10 year gap.");
      return;
    }
    try {
      setMatrixLoading(true);
      setError(null);
      setMatrix(await getPersonalYearMatrix(dob, from, to));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load personal year matrix"));
    } finally {
      setMatrixLoading(false);
    }
  };

  if (loading) return <LoadingState label="Loading numerology report" />;
  if (error && !loShu) return <ErrorState message={error} onRetry={() => router.replace("/astrologer/numerology")} />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.replace("/astrologer/numerology")}>Back</Button>
        <Text variant="headlineSmall" style={styles.headerTitle}>Numerology</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
        
        <SectionLabel title="Lo Shu Grid" />
        <LoShuGrid grid={loShu?.grid} />
        <View style={styles.cardGrid}>
          <NumberCard label="Personality Number" value={loShu?.driverNumber} note="Inner Nature" />
          <NumberCard label="Destiny Number" value={loShu?.destinyNumber} note="Life Path" />
          <NumberCard label="Kua Number" value={loShu?.kuaNumber} note="Personal Energy" />
          <NumberCard label="Name Number" value={loShu?.nameNumber} note="Compound" />
          <NumberCard label="Running Age" value={loShu?.runningAge} note="Years" />
          <NumberCard label="Zodiac" value={loShu?.zodiacNumber} note={loShu?.zodiacSign || "Zodiac Sign"} />
        </View>
        <RelationTable />
        <View style={styles.yearCards}>
          <NumberCard label="Current Personal Year" value={personalYear?.personalYear} />
          <NumberCard label="Current Personal Month" value={personalYear?.personalMonth} />
          <NumberCard label="Current Personal Day" value={personalYear?.personalDay} />
        </View>
        <SectionLabel title="Matrix for Personal Year & Month" />
        <View style={styles.yearInputs}>
          <TextInput value={fromYear} onChangeText={setFromYear} keyboardType="number-pad" placeholder="From Year" style={styles.yearInput} />
          <TextInput value={toYear} onChangeText={setToYear} keyboardType="number-pad" placeholder="To Year" style={styles.yearInput} />
          <Pressable style={styles.smallBtn} onPress={refreshMatrix} disabled={matrixLoading}>
            <Text style={styles.smallBtnText}>{matrixLoading ? "Loading" : "Apply"}</Text>
          </Pressable>
        </View>
        {error ? <Text style={styles.validation}>{error}</Text> : null}
        <MatrixTable rows={matrix} />
        <StaticAdvice />
        <PersonalYearReading value={personalYear?.personalYear} />
      </ScrollView>
      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}

function FieldIcon({ icon }: { icon: keyof typeof MaterialCommunityIcons.glyphMap }) {
  return (
    <View style={styles.fieldIcon}>
      <MaterialCommunityIcons name={icon} size={24} color="#111" />
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelText}>{title}</Text>
    </View>
  );
}

function LoShuGrid({ grid }: { grid?: LoShuGridResponse["grid"] }) {
  const rows = [grid?.topRow, grid?.middleRow, grid?.bottomRow].map((row, index) => row || Object.values(defaultGrid)[index]);
  return (
    <View style={styles.loShuGrid}>
      {rows.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => (
          <View key={`${rowIndex}-${colIndex}`} style={styles.loShuCell}>
            <Text style={styles.loShuText}>{value || "-"}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function NumberCard({ label, value, note }: { label: string; value?: string | number; note?: string }) {
  return (
    <View style={styles.numberCard}>
      <Text style={styles.numberLabel}>{label}</Text>
      <Text style={styles.numberValue}>{value ?? "-"}</Text>
      {note ? <Text style={styles.numberNote} numberOfLines={1}>{note}</Text> : null}
    </View>
  );
}

function RelationTable() {
  return (
    <ScrollView >
      <View style={styles.relationTable}>
        <View style={styles.relationHeader}>
          <Text style={[styles.relationHeadText, styles.relationNumberHead]}>Number</Text>
          <Text style={[styles.relationHeadText, styles.relationFriendHead]}>Friend</Text>
          <Text style={[styles.relationHeadText, styles.relationEnemyHead]}>Enemy</Text>
          <Text style={[styles.relationHeadText, styles.relationNeutralHead]}>Neutral</Text>
        </View>
        {relationRows.map(([label, number, friend, enemy, neutral]) => (
          <View key={label} style={styles.relationRow}>
            <Text style={[styles.relationLabel, styles.relationNameCell]}>{label}</Text>
            <Text style={[styles.relationCell, styles.relationNumberCell]}>{number}</Text>
            <Text style={[styles.relationCell, styles.relationFriendCell, styles.friendText]}>{friend}</Text>
            <Text style={[styles.relationCell, styles.relationEnemyCell, styles.enemyText]}>{enemy}</Text>
            <Text style={[styles.relationCell, styles.relationNeutralCell, styles.neutralText]}>{neutral}</Text>
          </View>
        ))}
        <View style={styles.relationFoot}>
          <Text style={[styles.relationLabel, styles.relationFootLabel]}>Relation in Personality{"\n"}& Destiny Number</Text>
          <Text style={styles.relationFootValue}>5:9 = Neutral</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function StaticAdvice() {
  return (
    <View style={styles.adviceStack}>
      {advice.map(([icon, title, color, copy]) => (
        <View key={title} style={styles.adviceBox}>
          <MaterialCommunityIcons name={icon} size={27} color="#111" />
          <View style={styles.adviceCopy}>
            <Text style={[styles.adviceTitle, { color }]}>{title}</Text>
            <Text style={styles.adviceText}>{copy}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function getMonthValue(row: PersonalYearMatrixItem, shortMonth: string, fullMonth: string) {
  const directKeys = [
    shortMonth,
    shortMonth.toLowerCase(),
    shortMonth.toUpperCase(),
    fullMonth,
    fullMonth.toLowerCase(),
    fullMonth.toUpperCase()
  ];

  for (const key of directKeys) {
    const value = row[key];
    if (typeof value === "string" || typeof value === "number") return value;
  }

  const monthItem = row.months?.find((item) => {
    const apiMonth = item.month?.toLowerCase();
    return apiMonth === shortMonth.toLowerCase() || apiMonth === fullMonth.toLowerCase();
  });
  if (monthItem?.personalMonth !== undefined) return monthItem.personalMonth;

  const monthSources = [row.personalMonths, row.month, row.personalMonth].filter(
    (value): value is Record<string, string | number> => Boolean(value) && typeof value === "object"
  );

  for (const source of monthSources) {
    for (const key of directKeys) {
      const value = source[key];
      if (typeof value === "string" || typeof value === "number") return value;
    }
  }

  return "-";
}

function MatrixTable({ rows }: { rows: PersonalYearMatrixItem[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.matrixTable}>
        <View style={styles.matrixTopHeader}>
          <Text style={[styles.matrixHeadCell, styles.matrixYear, styles.matrixTallHead]}>Year</Text>
          <Text style={[styles.matrixHeadCell, styles.matrixPersonal, styles.matrixTallHead]}>Personal{"\n"}Year</Text>
          <Text style={styles.matrixMonthGroup}>Personal Month</Text>
        </View>
        <View style={styles.matrixMonthHeader}>
          <View style={[styles.matrixHeadSpacer, styles.matrixYear]} />
          <View style={[styles.matrixHeadSpacer, styles.matrixPersonal]} />
          {months.map(([shortMonth]) => <Text key={shortMonth} style={styles.matrixHeadCell}>{shortMonth}</Text>)}
        </View>
        {rows.map((row) => (
          <View key={row.year} style={styles.matrixRow}>
            <Text style={[styles.matrixCell, styles.matrixYear]}>{row.year}</Text>
            <Text style={[styles.matrixCell, styles.matrixPersonal]}>{row.personalYear || "-"}</Text>
            {months.map(([shortMonth, fullMonth]) => (
              <Text key={shortMonth} style={styles.matrixCell}>{getMonthValue(row, shortMonth, fullMonth)}</Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function PersonalYearReading({ value }: { value?: string }) {
  return (
    <View style={styles.readingBox}>
      <Text style={styles.readingTitle}>Personal Year reading</Text>
      {personalYearNotes.map((note, index) => (
        <Text key={note} style={styles.readingText}>- {index === 0 && value ? `Your running personal year is ${value}.` : note}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f7f2" },
  header: {
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg
  },
  headerTitle: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  headerSpacer: { width: 70 },
  scroll: { flex: 1 },
  content: { minHeight: "100%", alignSelf: "center", width: "100%", maxWidth: 420, backgroundColor: "#ffffc9", padding: spacing.lg, paddingBottom: 104 },
  panel: { paddingTop: spacing.lg, gap: spacing.lg },
  formStack: { flexDirection: "row", alignItems: "flex-start", borderWidth: 1.2, borderColor: "#111", borderRadius: 5, backgroundColor: "#fff" },
  fieldIcon: { width: 36, minHeight: 31, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, minHeight: 31, paddingVertical: 5, paddingHorizontal: 0, color: "#111", fontFamily: "serif", fontSize: 16 },
  dateSelect: { flex: 1, minHeight: 35, justifyContent: "center", paddingRight: spacing.sm },
  dateSelectText: { color: "#111", fontFamily: "serif", fontSize: 16 },
  placeholderText: { color: "#9c9c9c" },
  genderRow: { flexDirection: "row", gap: spacing.sm },
  genderBtn: { flex: 1, height: 34, borderRadius: 5, borderWidth: 1, borderColor: "#111", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  genderBtnActive: { backgroundColor: "#c7efc8", borderColor: "#34a853" },
  genderText: { color: "#111", fontSize: 13, fontWeight: "700" },
  genderTextActive: { color: "#145c24", fontWeight: "900" },
  calculationSelect: { flex: 1 },
  calculationTrigger: { minHeight: 35, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: spacing.sm },
  calculationValue: { fontFamily: "serif", fontSize: 16, color: "#111" },
  calculationMenu: { borderTopWidth: 1, borderTopColor: "#111" },
  calculationOption: { minHeight: 34, justifyContent: "center", paddingRight: spacing.sm, borderTopWidth: 1, borderTopColor: "#e5e5e5" },
  calculationOptionActive: { backgroundColor: "#c7efc8" },
  calculationOptionText: { fontFamily: "serif", fontSize: 15, color: "#111" },
  calculationOptionTextActive: { color: "#145c24", fontWeight: "900" },
  validation: { color: colors.danger, fontSize: 12, fontWeight: "800", lineHeight: 17 },
  submitBtn: { height: 32, borderRadius: 5, borderWidth: 1, borderColor: "#111", backgroundColor: "#ffcf28", alignItems: "center", justifyContent: "center" },
  submitText: { fontFamily: "serif", fontWeight: "900", color: "#111", fontSize: 16 },
  resultContent: { alignSelf: "center", width: "100%", maxWidth: 420, backgroundColor: "#ffffc9", padding: spacing.lg, paddingBottom: 104, gap: spacing.lg },
  sectionLabel: { alignSelf: "center", minWidth: 190, height: 30, borderRadius: 5, borderWidth: 1, borderColor: "#39a853", backgroundColor: "#bff2c6", alignItems: "center", justifyContent: "center" },
  sectionLabelText: { fontFamily: "serif", color: "#145c24", fontSize: 16, fontWeight: "900" },
  loShuGrid: { alignSelf: "center", width: 192, height: 144, flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#111", backgroundColor: "#fff" },
  loShuCell: { width: 63.66, height: 47.66, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", alignItems: "center", justifyContent: "center" },
  loShuText: { fontSize: 18, fontWeight: "900", color: "#111" },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10, columnGap: 10 },
  yearCards: { flexDirection: "row", gap: spacing.sm },
  numberCard: { flexGrow: 1, flexBasis: "31%", minHeight: 66, borderRadius: 8, borderWidth: 2, borderColor: "#68ad62", backgroundColor: "#fff", alignItems: "center", justifyContent: "center", paddingHorizontal: 5, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 2, elevation: 2 },
  numberLabel: { color: "#777", fontSize: 9, fontWeight: "900", textAlign: "center" },
  numberValue: { color: "#136a28", fontSize: 24, lineHeight: 28, fontWeight: "900" },
  numberNote: { color: "#777", fontSize: 7, fontWeight: "800" },
  relationTable: {backgroundColor: "#cfcfcf", borderWidth: 1.5, borderTopColor: "#f3fff0", borderLeftColor: "#f3fff0", borderRightColor: "#6d806d", borderBottomColor: "#6d806d" },
  relationHeader: { flexDirection: "row", minHeight: 58 },
  relationHeadText: { textAlign: "center", textAlignVertical: "center", fontFamily: "serif", fontSize: 10, fontWeight: "900", color: "#111", backgroundColor: "#a9d4ad", borderWidth: 1.5, borderTopColor: "#eaffdf", borderLeftColor: "#eaffdf", borderRightColor: "#5f7a63", borderBottomColor: "#5f7a63" },
  relationNumberHead: { width: 90, fontSize: 12 },
  relationFriendHead: { width: 76 },
  relationEnemyHead: { width: 80 },
  relationNeutralHead: { width: 80 },
  relationRow: { flexDirection: "row", minHeight: 52 },
  relationLabel: { textAlign: "center", textAlignVertical: "center", fontFamily: "serif", fontSize: 8, fontWeight: "900", color: "#174f1d", backgroundColor: "#b8ddb9", borderWidth: 1.5, borderTopColor: "#eaffdf", borderLeftColor: "#eaffdf", borderRightColor: "#5f7a63", borderBottomColor: "#5f7a63" },
  relationNameCell: { width: 60 },
  relationCell: { textAlign: "center", textAlignVertical: "center", fontSize: 13, fontWeight: "900", color: "#111", backgroundColor: "#d8d8d8", borderWidth: 1.5, borderTopColor: "#f8f8f8", borderLeftColor: "#f8f8f8", borderRightColor: "#858585", borderBottomColor: "#858585" },
  relationNumberCell: { width: 30 },
  relationFriendCell: { width: 76 },
  relationEnemyCell: { width: 80 },
  relationNeutralCell: { width: 80 },
  friendText: { color: "#00a84f" },
  enemyText: { color: "#f00" },
  neutralText: { color: "#858585" },
  relationFoot: { flexDirection: "row", minHeight: 56 },
  relationFootLabel: { width: 90, fontSize: 10, lineHeight: 15 },
  relationFootValue: { width: 235, textAlign: "center", textAlignVertical: "center", color: "#111", fontSize: 14, fontWeight: "900", backgroundColor: "#d8d8d8", borderWidth: 1.5, borderTopColor: "#f8f8f8", borderLeftColor: "#f8f8f8", borderRightColor: "#858585", borderBottomColor: "#858585" },
  adviceStack: { gap: spacing.md },
  adviceBox: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1.5, borderColor: "#0d3440", backgroundColor: "#fffde5", paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  adviceCopy: { flex: 1 },
  adviceTitle: { fontFamily: "serif", fontSize: 27, lineHeight: 31, fontWeight: "900" },
  adviceText: { fontFamily: "serif", color: "#111", fontSize: 16, lineHeight: 20 },
  yearInputs: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  yearInput: { flex: 1, height: 36, borderWidth: 1, borderColor: "#111", borderRadius: 5, backgroundColor: "#fff", paddingHorizontal: 8, color: "#111" },
  smallBtn: { height: 36, paddingHorizontal: spacing.md, borderRadius: 5, borderWidth: 1, borderColor: "#111", backgroundColor: "#ffcf28", alignItems: "center", justifyContent: "center" },
  smallBtnText: { color: "#111", fontWeight: "900" },
  matrixTable: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#111", backgroundColor: "#fff" },
  matrixTopHeader: { flexDirection: "row", backgroundColor: "#ffd95d" },
  matrixMonthHeader: { flexDirection: "row" },
  matrixRow: { flexDirection: "row" },
  matrixHeadCell: { width: 48, minHeight: 34, textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", fontSize: 12, fontWeight: "900", color: "#111" },
  matrixTallHead: { minHeight: 68 },
  matrixHeadSpacer: { minHeight: 34, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", backgroundColor: "#ffd95d" },
  matrixMonthGroup: { width: 576, minHeight: 34, textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", fontFamily: "serif", fontSize: 14, fontWeight: "900", color: "#111" },
  matrixCell: { width: 48, minHeight: 34, textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", fontSize: 15, fontWeight: "800", color: "#111" },
  matrixYear: { width: 54 },
  matrixPersonal: { width: 86 },
  readingBox: { borderWidth: 2, borderColor: "#0d3440", backgroundColor: "#fffde5", padding: spacing.sm },
  readingTitle: { fontFamily: "serif", color: "#111", fontSize: 25, lineHeight: 30, fontWeight: "900" },
  readingText: { fontFamily: "serif", color: "#111", fontSize: 16, lineHeight: 21 }
});
