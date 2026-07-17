import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Text } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { DashaMahadashaItem, getDashaCalculation } from "@/services/numerology.service";
import { localizeDigitsInText } from "@/components/Numerology/Lushu-grid/utils";

type DashaRow = {
  id: string;
  fromDate: string;
  toDate: string;
  mahadashaNumber?: number;
  antardashaNumber?: number;
  startTimestamp: number;
  endTimestamp: number;
};

type PickerTarget = "from" | "to";

const maxToDate = new Date(2060, 11, 31);
const defaultToDate = new Date(2030, 11, 31);
const batchSize = 28;
const rowHeight = 36;

export function DashaChart({ dateOfBirth }: { dateOfBirth?: string }) {
  const { language, t } = useTranslation();
  const listRef = useRef<ScrollView>(null);
  const { height } = useWindowDimensions();
  const dobDate = useMemo(() => normalizeDisplayDate(dateOfBirth), [dateOfBirth]);
  const [fromDate, setFromDate] = useState<Date | null>(dobDate);
  const [toDate, setToDate] = useState<Date>(defaultToDate);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [allRows, setAllRows] = useState<DashaRow[]>([]);
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const [visibleEndIndex, setVisibleEndIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dobDate) return;
    setFromDate((current) => current || dobDate);
  }, [dobDate]);

  const validationMessage = useMemo(() => validateDates(dobDate, fromDate, toDate), [dobDate, fromDate, toDate]);
  const visibleRows = useMemo(() => allRows.slice(visibleStartIndex, visibleEndIndex + 1), [allRows, visibleEndIndex, visibleStartIndex]);
  const missingDob = !dobDate;
  const tableMaxHeight = Math.min(430, Math.round(height * 0.46));
  const tableBodyHeight = loading || error || missingDob
    ? 150
    : Math.min(tableMaxHeight, Math.max(rowHeight, visibleRows.length * rowHeight));

  const generateChart = useCallback(async () => {
    if (!dobDate || !fromDate || !toDate || validationMessage) return;

    try {
      setLoading(true);
      setError("");
      const response = await getDashaCalculation(formatDisplayDate(dobDate), formatDisplayDate(fromDate), formatDisplayDate(toDate));
      const rows = flattenDashaRows(response.mahadashas || [], fromDate, toDate);
      setAllRows(rows);

      if (!rows.length) {
        setVisibleStartIndex(0);
        setVisibleEndIndex(-1);
        setError("No Dasha data is available for the selected date range.");
        return;
      }

      const initialWindow = getInitialWindow(rows, fromDate, toDate);
      setVisibleStartIndex(initialWindow.start);
      setVisibleEndIndex(initialWindow.end);

      requestAnimationFrame(() => {
        const activeVisibleIndex = rows.slice(initialWindow.start, initialWindow.end + 1).findIndex((row) => isTodayInRow(row));
        if (activeVisibleIndex >= 0) {
          listRef.current?.scrollTo({ y: Math.max(0, activeVisibleIndex * rowHeight - rowHeight * 3), animated: false });
        }
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to generate Mahadasha and Antardasha chart."));
    } finally {
      setLoading(false);
    }
  }, [dobDate, fromDate, toDate, validationMessage]);

  useEffect(() => {
    generateChart();
  }, [generateChart]);

  const selectDate = (event: DateTimePickerEvent, selected?: Date) => {
    const target = pickerTarget;
    setPickerTarget(null);
    if (event.type === "dismissed" || !selected || !target || !dobDate) return;

    if (target === "from") {
      const nextFrom = clampDateToRange(stripTime(selected), dobDate, toDate);
      setFromDate(nextFrom);
      return;
    }

    setToDate(clampDateToRange(stripTime(selected), fromDate || dobDate, maxToDate));
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    if (contentOffset.y < rowHeight * 2 && visibleStartIndex > 0) {
      setVisibleStartIndex((current) => Math.max(0, current - batchSize));
    }

    if (contentOffset.y + layoutMeasurement.height > contentSize.height - rowHeight * 3 && visibleEndIndex < allRows.length - 1) {
      setVisibleEndIndex((current) => Math.min(allRows.length - 1, current + batchSize));
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
          {t("Mahadasha & Antardasha")}{'\n'}{t("Chart")}
        </Text>
      </View>

      <View style={styles.filters}>
        <DateControl label="From Date" value={fromDate} onPress={() => setPickerTarget("from")} />
        <DateControl label="To Date" value={toDate} onPress={() => setPickerTarget("to")} />
      </View>

      {pickerTarget ? (
        <DateTimePicker
          value={(pickerTarget === "from" ? fromDate : toDate) || dobDate || new Date()}
          mode="date"
          display="default"
          minimumDate={pickerTarget === "from" ? dobDate || undefined : fromDate || dobDate || undefined}
          maximumDate={pickerTarget === "to" ? maxToDate : toDate}
          onChange={selectDate}
        />
      ) : null}

      {missingDob ? <Text style={styles.validation}>{t("Please select a valid Date of Birth.")}</Text> : null}
      {!missingDob && validationMessage ? <Text style={styles.validation}>{t(validationMessage)}</Text> : null}

      <View style={styles.table}>
        <TableHeader />
        <View style={[styles.tableBody, { height: tableBodyHeight }]}>
          {missingDob ? (
            <View style={styles.tableState}>
              <Text style={styles.validation}>{t("Please select a valid Date of Birth.")}</Text>
            </View>
          ) : loading ? (
            <View style={styles.tableState}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>{t("Loading")}</Text>
            </View>
          ) : error ? (
            <View style={styles.tableState}>
              <Text style={styles.validation}>{t(error)}</Text>
            </View>
          ) : (
            <ScrollView
              ref={listRef}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              onScroll={onScroll}
              scrollEventThrottle={80}
            >
              {visibleRows.map((item) => (
                <DashaTableRow key={item.id} row={item} active={isTodayInRow(item)} language={language} />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

function DateControl({ label, value, onPress }: { label: string; value: Date | null; onPress: () => void }) {
  const { language, t } = useTranslation();
  return (
    <Pressable style={styles.dateControl} onPress={onPress}>
      <Text style={styles.dateLabel}>{t(label)}</Text>
      <Text style={styles.dateValue}>{value ? localizeDigitsInText(formatDisplayDate(value), language) : t("Select Date")}</Text>
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
      <View style={[styles.stackedHeaderCell, styles.mahaCol]}>
        <Text style={styles.headerText}>{t("Maha")}{'\n'}{t("Dasha")}</Text>
      </View>
      <View style={[styles.stackedHeaderCell, styles.antarCol]}>
        <Text style={styles.headerText}>{t("Antar")}{'\n'}{t("Dasha")}</Text>
      </View>
    </View>
  );
}

function DashaTableRow({ row, active, language }: { row: DashaRow; active: boolean; language: ReturnType<typeof useTranslation>["language"] }) {
  return (
    <View style={[styles.bodyRow, active && styles.activeRow]}>
      <Cell style={styles.fromCol} value={localizeDigitsInText(compactDate(row.fromDate), language)} />
      <Cell style={styles.toCol} value={localizeDigitsInText(compactDate(row.toDate), language)} />
      <Cell style={styles.mahaCol} value={localizeDigitsInText(row.mahadashaNumber ?? "-", language)} />
      <Cell style={styles.antarCol} value={localizeDigitsInText(row.antardashaNumber ?? "-", language)} accent />
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

export function parseDisplayDate(value?: string) {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
  return stripTime(date);
}

function normalizeDisplayDate(value?: string) {
  const direct = parseDisplayDate(value);
  if (direct) return direct;
  const isoMatch = value?.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!isoMatch) return null;
  const [, year, month, day] = isoMatch;
  return parseDisplayDate(`${day}-${month}-${year}`);
}

function formatDisplayDate(date: Date) {
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

function compactDate(value: string) {
  const parsed = parseDisplayDate(value);
  if (!parsed) return value;
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
}

function compareDates(a: Date, b: Date) {
  return stripTime(a).getTime() - stripTime(b).getTime();
}

function clampDateToRange(date: Date, minDate: Date, maxDate: Date) {
  if (compareDates(date, minDate) < 0) return minDate;
  if (compareDates(date, maxDate) > 0) return maxDate;
  return date;
}

function validateDates(dobDate: Date | null, fromDate: Date | null, toDate: Date | null) {
  if (!dobDate) return "Please select a valid From Date.";
  if (!fromDate) return "Please select a valid From Date.";
  if (!toDate) return "Please select a valid To Date.";
  if (compareDates(fromDate, dobDate) < 0) return "From Date cannot be earlier than Date of Birth.";
  if (compareDates(toDate, fromDate) < 0) return "To Date cannot be earlier than From Date.";
  if (compareDates(toDate, maxToDate) > 0) return "To Date cannot be later than 31-12-2060.";
  return "";
}

function flattenDashaRows(mahadashas: DashaMahadashaItem[] = [], selectedFromDate: Date, selectedToDate: Date) {
  const rows = mahadashas.flatMap((mahadasha, mahaIndex) =>
    (mahadasha.antardashas || []).map((antardasha, antarIndex) => {
      const startDate = parseDisplayDate(antardasha.startDate);
      const endDate = parseDisplayDate(antardasha.endDate);
      return {
        id: `${mahaIndex}-${antarIndex}-${antardasha.startDate}-${antardasha.endDate}`,
        fromDate: antardasha.startDate || "",
        toDate: antardasha.endDate || "",
        mahadashaNumber: antardasha.mahadashaNumber ?? mahadasha.mahadashaNumber,
        antardashaNumber: antardasha.antardashaNumber,
        startTimestamp: startDate?.getTime() ?? NaN,
        endTimestamp: endDate?.getTime() ?? NaN
      };
    })
  );

  const unique = new Map<string, DashaRow>();
  rows
    .filter((row) => Number.isFinite(row.startTimestamp) && Number.isFinite(row.endTimestamp))
    .filter((row) => row.startTimestamp <= selectedToDate.getTime() && row.endTimestamp >= selectedFromDate.getTime())
    .sort((a, b) => a.startTimestamp - b.startTimestamp)
    .forEach((row) => {
      const key = `${row.fromDate}-${row.toDate}-${row.mahadashaNumber}-${row.antardashaNumber}`;
      if (!unique.has(key)) unique.set(key, row);
    });

  return Array.from(unique.values());
}

function getInitialWindow(rows: DashaRow[], fromDate: Date, toDate: Date) {
  if (rows.length <= batchSize) return { start: 0, end: rows.length - 1 };

  const selectedRangeYears = Math.abs(toDate.getFullYear() - fromDate.getFullYear());
  if (selectedRangeYears <= 10) return { start: 0, end: rows.length - 1 };

  const today = stripTime(new Date());
  let anchorIndex = 0;

  if (compareDates(today, fromDate) >= 0 && compareDates(today, toDate) <= 0) {
    anchorIndex = rows.findIndex((row) => isTodayInRow(row));
    if (anchorIndex < 0) anchorIndex = rows.findIndex((row) => row.startTimestamp >= today.getTime());
  } else if (compareDates(toDate, today) < 0) {
    anchorIndex = rows.length - 1;
  } else {
    anchorIndex = 0;
  }

  anchorIndex = Math.max(0, anchorIndex);
  const start = Math.max(0, anchorIndex - Math.floor(batchSize / 2));
  const end = Math.min(rows.length - 1, start + batchSize - 1);
  return { start: Math.max(0, end - batchSize + 1), end };
}

function isTodayInRow(row: DashaRow) {
  const today = stripTime(new Date()).getTime();
  return row.startTimestamp <= today && row.endTimestamp >= today;
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  titleWrap: { minHeight: 74, borderRadius: 6, backgroundColor: "#bff2c6", alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md, paddingVertical: 8, shadowColor: "#0d5a1d", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 5, elevation: 4 },
  title: { color: "#145c24", fontSize: 20, lineHeight: 32, fontWeight: "900", textAlign: "center", includeFontPadding: true },
  filters: { flexDirection: "row", gap: spacing.sm },
  dateControl: { flex: 1, minHeight: 52, borderRadius: 6, borderWidth: 1, borderColor: "#b7dcae", backgroundColor: "#fffdf5", justifyContent: "center", paddingHorizontal: spacing.sm, paddingVertical: 5 },
  dateLabel: { color: "#375c34", fontSize: 11, fontWeight: "900", textAlign: "center" },
  dateValue: { color: "#111", fontSize: 13, lineHeight: 18, fontWeight: "900", textAlign: "center" },
  validation: { color: colors.danger, textAlign: "center", fontSize: 12, lineHeight: 17, fontWeight: "800" },
  table: { borderWidth: 1, borderColor: "#b7dcae", borderRadius: 6, backgroundColor: "#fffdf5", overflow: "hidden", shadowColor: "#0d5a1d", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 5, elevation: 3 },
  headerRow: { flexDirection: "row", minHeight: 88, backgroundColor: "#ffe082" },
  dateHeaderGroup: { width: "58%", borderRightWidth: 1, borderColor: "#b7dcae" },
  headerText: { color: "#000", fontSize: 13, lineHeight: 17, fontWeight: "900", textAlign: "center", includeFontPadding: true },
  dateHeaderText: { paddingVertical: 8, paddingHorizontal: 6 },
  subHeaderRow: { flex: 1, flexDirection: "row", borderTopWidth: 1, borderColor: "#b7dcae" },
  subHeaderCell: { alignItems: "center", justifyContent: "center", backgroundColor: "#fffde8" },
  fromHeaderCell: { borderRightWidth: 1, borderRightColor: "#b7dcae" },
  subHeaderText: { color: "#000", fontSize: 12, fontWeight: "900", textAlign: "center" },
  stackedHeaderCell: { alignItems: "center", justifyContent: "center", borderRightWidth: 1, borderColor: "#b7dcae", paddingHorizontal: 2 },
  tableBody: { backgroundColor: "#fffdf5" },
  tableState: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.md },
  loadingText: { marginTop: spacing.sm, color: "#375c34", fontWeight: "900" },
  bodyRow: { height: rowHeight, flexDirection: "row", backgroundColor: "#fffdf5" },
  activeRow: { backgroundColor: "#f4ffe0" },
  bodyCell: { borderTopWidth: 1, borderRightWidth: 1, borderColor: "#d6dfc9", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  dateSubCol: { width: "50%" },
  fromCol: { width: "29%" },
  toCol: { width: "29%" },
  mahaCol: { width: "21%" },
  antarCol: { width: "21%", borderRightWidth: 0 },
  cellText: { color: "#000", fontSize: 12, lineHeight: 14, fontWeight: "900", textAlign: "center" },
  accentText: { color: "#075416" }
});
