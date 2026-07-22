import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Text } from "react-native-paper";

import { localizeDigitsInText } from "@/components/Numerology/Lushu-grid/utils";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { getPratyantarDasha, PratyantarDashaItem } from "@/services/numerology.service";

type PratyantarRow = {
  id: string;
  fromDate: string;
  toDate: string;
  pratyantarDashaNumber?: number;
};

const defaultYears = 10;
const rowHeight = 38;

export function PratyantarDashaChart({ dateOfBirth }: { dateOfBirth?: string }) {
  const { language, t } = useTranslation();
  const initialDobRef = useRef("");
  const dobDate = useMemo(() => normalizeDate(dateOfBirth), [dateOfBirth]);
  const [fromDate, setFromDate] = useState<Date>(() => new Date(new Date().getFullYear(), 0, 1));
  const [yearsText, setYearsText] = useState(String(defaultYears));
  const [showPicker, setShowPicker] = useState(false);
  const [rows, setRows] = useState<PratyantarRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const years = Number(yearsText);
  const validationMessage = useMemo(() => {
    if (!dobDate) return "Please select a valid Date of Birth.";
    if (compareDates(fromDate, dobDate) < 0) return "From Date cannot be earlier than Date of Birth.";
    if (!Number.isInteger(years) || years < 1 || years > 99) return "Years must be between 1 and 99.";
    return "";
  }, [dobDate, fromDate, years]);

  const tableBodyHeight = loading || error || validationMessage || !hasGenerated
    ? 130
    : Math.min(430, Math.max(rowHeight, rows.length * rowHeight));

  const loadChart = useCallback(async () => {
    if (!dobDate || validationMessage) return;

    try {
      setLoading(true);
      setError("");
      setHasGenerated(true);
      const response = await getPratyantarDasha(formatDisplayDate(dobDate), formatDisplayDate(fromDate), years);
      const nextRows = response.map(mapPratyantarRow).filter((row) => row.fromDate || row.toDate);
      setRows(nextRows);

      if (!nextRows.length) {
        setError("No Pratyantar Dasha data is available for the selected range.");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to generate Pratyantar Dasha chart."));
    } finally {
      setLoading(false);
    }
  }, [dobDate, fromDate, validationMessage, years]);

  useEffect(() => {
    if (!dobDate || validationMessage) return;
    const dobKey = formatDisplayDate(dobDate);
    if (initialDobRef.current === dobKey) return;
    initialDobRef.current = dobKey;
    loadChart();
  }, [dobDate, loadChart, validationMessage]);

  const selectFromDate = (event: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(false);
    if (event.type === "dismissed" || !selected) return;
    setFromDate(stripTime(selected));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
          {t("Pratyantar Dasha")} {t("Chart")}
        </Text>
        <View style={styles.filters}>
          <DateControl value={fromDate} onPress={() => setShowPicker(true)} />
          <View style={styles.inputControl}>
            <Text style={styles.inputLabel}>{t("Years")}</Text>
            <TextInput
              value={yearsText}
              onChangeText={(value) => setYearsText(value.replace(/[^0-9]/g, "").slice(0, 2))}
              keyboardType="number-pad"
              style={styles.yearsInput}
              maxLength={2}
            />
          </View>
          <Pressable style={[styles.goButton, (loading || !!validationMessage) && styles.goButtonDisabled]} onPress={loadChart} disabled={loading || !!validationMessage}>
            <Text style={styles.goButtonText}>{loading ? t("Loading") : t("Go")}</Text>
          </Pressable>
        </View>
      </View>

      {showPicker ? (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display="default"
          minimumDate={dobDate || undefined}
          onChange={selectFromDate}
        />
      ) : null}

      {validationMessage ? <Text style={styles.validation}>{t(validationMessage)}</Text> : null}

      <View style={styles.table}>
        <TableHeader />
        <View style={[styles.tableBody, { height: tableBodyHeight }]}>
          {!hasGenerated ? (
            <View style={styles.tableState}>
              <Text style={styles.emptyText}>{t("Select From Date and Years, then tap Go.")}</Text>
            </View>
          ) : loading ? (
            <View style={styles.tableState}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>{t("Loading")}</Text>
            </View>
          ) : error || validationMessage ? (
            <View style={styles.tableState}>
              <Text style={styles.validation}>{t(error || validationMessage)}</Text>
            </View>
          ) : (
            <ScrollView nestedScrollEnabled persistentScrollbar showsVerticalScrollIndicator>
              {rows.map((item) => (
                <TableRow key={item.id} row={item} language={language} />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

function DateControl({ value, onPress }: { value: Date; onPress: () => void }) {
  const { language, t } = useTranslation();
  return (
    <Pressable style={styles.dateControl} onPress={onPress}>
      <Text style={styles.inputLabel}>{t("From Date")}</Text>
      <Text style={styles.dateValue}>{localizeDigitsInText(formatDisplayDate(value), language)}</Text>
    </Pressable>
  );
}

function TableHeader() {
  const { t } = useTranslation();
  return (
    <View style={styles.headerRow}>
      <View style={styles.dateHeaderGroup}>
        <Text style={[styles.headerText, styles.dateHeaderText]}>{t("Date")}</Text>
        <View style={styles.subHeaderRow}>
          <View style={[styles.subHeaderCell, styles.dateSubCol, styles.fromHeaderCell]}>
            <Text style={styles.subHeaderText}>{t("From")}</Text>
          </View>
          <View style={[styles.subHeaderCell, styles.dateSubCol]}>
            <Text style={styles.subHeaderText}>{t("To")}</Text>
          </View>
        </View>
      </View>
      <View style={[styles.stackedHeaderCell, styles.pratyantarCol]}>
        <Text style={styles.headerText}>{t("Pratyantar")}{'\n'}{t("Dasha")}</Text>
      </View>
    </View>
  );
}

function TableRow({ row, language }: { row: PratyantarRow; language: ReturnType<typeof useTranslation>["language"] }) {
  return (
    <View style={styles.bodyRow}>
      <Cell style={styles.fromCol} value={localizeDigitsInText(compactDate(row.fromDate), language)} />
      <Cell style={styles.toCol} value={localizeDigitsInText(compactDate(row.toDate), language)} />
      <Cell style={styles.pratyantarCol} value={localizeDigitsInText(row.pratyantarDashaNumber ?? "-", language)} accent />
    </View>
  );
}

function Cell({ value, style, accent }: { value: string | number; style: object; accent?: boolean }) {
  return (
    <View style={[styles.bodyCell, style]}>
      <Text style={[styles.cellText, accent && styles.accentText]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>
        {String(value)}
      </Text>
    </View>
  );
}

function mapPratyantarRow(item: PratyantarDashaItem, index: number): PratyantarRow {
  const fromDate = normalizeApiDate(item.effectiveStartDate || item.birthdayDate);
  const toDate = normalizeApiDate(item.effectiveEndDate || item.birthdayDate);
  return {
    id: `${item.calculationYear || index}-${fromDate}-${toDate}-${item.pratyantarDashaNumber || "-"}`,
    fromDate,
    toDate,
    pratyantarDashaNumber: item.pratyantarDashaNumber
  };
}

function normalizeDate(value?: string) {
  const display = parseDisplayDate(value);
  if (display) return display;

  const isoMatch = value?.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!isoMatch) return null;
  const [, year, month, day] = isoMatch;
  return parseDisplayDate(`${day}-${month}-${year}`);
}

function normalizeApiDate(value?: string) {
  const parsed = normalizeDate(value);
  return parsed ? formatDisplayDate(parsed) : value || "";
}

function parseDisplayDate(value?: string) {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
  return stripTime(date);
}

function formatDisplayDate(date: Date) {
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

function compactDate(value: string) {
  const parsed = parseDisplayDate(value);
  if (!parsed) return value;
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${String(parsed.getFullYear()).slice(-2)}`;
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function compareDates(a: Date, b: Date) {
  return stripTime(a).getTime() - stripTime(b).getTime();
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  titleWrap: { minHeight: 118, borderRadius: 6, backgroundColor: "#dfff45", alignItems: "flex-start", justifyContent: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 7, shadowColor: "#0d5a1d", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 5, elevation: 3 },
  title: { width: "100%", color: "#145c24", fontSize: 19, lineHeight: 25, fontWeight: "900", textAlign: "left", writingDirection: "ltr", includeFontPadding: true },
  filters: { width: "100%", flexDirection: "row", gap: spacing.sm },
  dateControl: { flex: 1, minHeight: 44, borderRadius: 6, borderWidth: 1, borderColor: "#b7dcae", backgroundColor: "#fffdf5", justifyContent: "center", paddingHorizontal: spacing.sm, paddingVertical: 5 },
  inputControl: { width: 82, minHeight: 44, borderRadius: 6, borderWidth: 1, borderColor: "#b7dcae", backgroundColor: "#fffdf5", justifyContent: "center", paddingHorizontal: spacing.sm, paddingVertical: 5 },
  inputLabel: { color: "#375c34", fontSize: 11, fontWeight: "900", textAlign: "center" },
  dateValue: { color: "#111", fontSize: 13, lineHeight: 18, fontWeight: "900", textAlign: "center" },
  yearsInput: { minHeight: 23, padding: 0, color: "#111", fontSize: 14, lineHeight: 18, fontWeight: "900", textAlign: "center" },
  goButton: { width: 58, minHeight: 44, borderRadius: 6, backgroundColor: "#ffcf28", alignItems: "center", justifyContent: "center", paddingHorizontal: 6, shadowColor: "#7a6100", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 },
  goButtonDisabled: { opacity: 0.58 },
  goButtonText: { color: "#111", fontSize: 13, lineHeight: 17, fontWeight: "900", textAlign: "center" },
  validation: { color: colors.danger, textAlign: "center", fontSize: 12, lineHeight: 17, fontWeight: "800" },
  table: { borderWidth: 1, borderColor: "#d8e8cf", borderRadius: 6, backgroundColor: "#fffdf5", overflow: "hidden", shadowColor: "#0d5a1d", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 5, elevation: 3 },
  headerRow: { flexDirection: "row", minHeight: 56, backgroundColor: "#ffd866" },
  dateHeaderGroup: { width: "60%", borderRightWidth: 1, borderColor: "#d6dfc9" },
  headerText: { color: "#000", fontSize: 13, lineHeight: 16, fontWeight: "900", textAlign: "center", includeFontPadding: true },
  dateHeaderText: { paddingVertical: 4, paddingHorizontal: 6 },
  subHeaderRow: { flex: 1, flexDirection: "row", borderTopWidth: 1, borderColor: "#d6dfc9" },
  subHeaderCell: { alignItems: "center", justifyContent: "center", backgroundColor: "#ffffd1" },
  fromHeaderCell: { borderRightWidth: 1, borderRightColor: "#d6dfc9" },
  subHeaderText: { color: "#000", fontSize: 12, fontWeight: "900", textAlign: "center" },
  stackedHeaderCell: { alignItems: "center", justifyContent: "center", paddingHorizontal: 2 },
  tableBody: { backgroundColor: "#efefef" },
  tableState: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.md },
  loadingText: { marginTop: spacing.sm, color: "#375c34", fontWeight: "900" },
  emptyText: { color: "#375c34", textAlign: "center", fontSize: 12, lineHeight: 17, fontWeight: "800" },
  bodyRow: { height: rowHeight, flexDirection: "row", backgroundColor: "#efefef" },
  bodyCell: { borderTopWidth: 1, borderRightWidth: 1, borderColor: "#d6dfc9", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  dateSubCol: { width: "50%" },
  fromCol: { width: "30%" },
  toCol: { width: "30%" },
  pratyantarCol: { width: "40%", borderRightWidth: 0 },
  cellText: { color: "#000", fontSize: 12, lineHeight: 14, fontWeight: "900", textAlign: "center" },
  accentText: { color: "#000" }
});
