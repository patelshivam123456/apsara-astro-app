import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { DashaCalculationResponse, DashaMahadashaItem, getDashaCalculation } from "@/services/numerology.service";
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

type YearWindow = {
  startYear: number;
  endYear: number;
};

const maxToDate = new Date(2060, 11, 31);
const windowYears = 11;
const windowRadius = 5;
const rowHeight = 36;
const scrollThreshold = rowHeight * 2;

export function DashaChart({ dateOfBirth }: { dateOfBirth?: string }) {
  const { language, t } = useTranslation();
  const listRef = useRef<ScrollView>(null);
  const lastContentHeightRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const pendingPrependRef = useRef(false);
  const { height } = useWindowDimensions();
  const dobDate = useMemo(() => normalizeDisplayDate(dateOfBirth), [dateOfBirth]);
  const [fullDashaData, setFullDashaData] = useState<DashaCalculationResponse | null>(null);
  const [allRows, setAllRows] = useState<DashaRow[]>([]);
  const [visibleWindow, setVisibleWindow] = useState<YearWindow | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [error, setError] = useState("");

  const validationMessage = useMemo(() => validateDates(dobDate), [dobDate]);
  const visibleRows = useMemo(() => {
    if (!visibleWindow) return [];
    return getRowsForYearWindow(allRows, visibleWindow);
  }, [allRows, visibleWindow]);
  const missingDob = !dobDate;
  const loadedRangeLabel = useMemo(() => {
    if (!visibleWindow) return "";
    return `${localizeDigitsInText(visibleWindow.startYear, language)} - ${localizeDigitsInText(visibleWindow.endYear, language)}`;
  }, [language, visibleWindow]);
  const tableMaxHeight = Math.min(430, Math.round(height * 0.46));
  const tableBodyHeight = loading || error || missingDob || validationMessage
    ? 150
    : Math.min(tableMaxHeight, Math.max(rowHeight, visibleRows.length * rowHeight + loadingIndicatorHeight(isLoadingPrevious) + loadingIndicatorHeight(isLoadingNext)));

  const generateChart = useCallback(async () => {
    if (!dobDate || validationMessage) {
      setFullDashaData(null);
      setAllRows([]);
      setVisibleWindow(null);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setFullDashaData(null);
      setAllRows([]);
      setVisibleWindow(null);
      const response = await getDashaCalculation(formatDisplayDate(dobDate), formatDisplayDate(dobDate), formatDisplayDate(maxToDate));
      const rows = flattenDashaRows(response.mahadashas || [], dobDate, maxToDate);
      setFullDashaData(response);
      setAllRows(rows);

      if (!rows.length) {
        setError("No Dasha data is available for the selected date range.");
        return;
      }

      setVisibleWindow(getInitialYearWindow(dobDate, maxToDate));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to generate Mahadasha and Antardasha chart."));
    } finally {
      setLoading(false);
    }
  }, [dobDate, validationMessage]);

  useEffect(() => {
    generateChart();
  }, [generateChart]);

  const loadPreviousWindow = useCallback(() => {
    if (!visibleWindow || isLoadingPrevious || !fullDashaData) return;

    const nextStartYear = Math.max(getMinimumYear(dobDate), visibleWindow.startYear - windowYears);
    if (nextStartYear >= visibleWindow.startYear) return;

    pendingPrependRef.current = true;
    setIsLoadingPrevious(true);
    requestAnimationFrame(() => {
      setVisibleWindow((current) => current ? { ...current, startYear: nextStartYear } : current);
      requestAnimationFrame(() => setIsLoadingPrevious(false));
    });
  }, [dobDate, fullDashaData, isLoadingPrevious, visibleWindow]);

  const loadNextWindow = useCallback(() => {
    if (!visibleWindow || isLoadingNext || !fullDashaData) return;

    const nextEndYear = Math.min(maxToDate.getFullYear(), visibleWindow.endYear + windowYears);
    if (nextEndYear <= visibleWindow.endYear) return;

    setIsLoadingNext(true);
    requestAnimationFrame(() => {
      setVisibleWindow((current) => current ? { ...current, endYear: nextEndYear } : current);
      requestAnimationFrame(() => setIsLoadingNext(false));
    });
  }, [fullDashaData, isLoadingNext, visibleWindow]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    lastScrollTopRef.current = contentOffset.y;
    lastContentHeightRef.current = contentSize.height;

    if (contentOffset.y <= scrollThreshold) {
      loadPreviousWindow();
    }

    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - scrollThreshold) {
      loadNextWindow();
    }
  };

  const onContentSizeChange = (_width: number, contentHeight: number) => {
    if (!pendingPrependRef.current) {
      lastContentHeightRef.current = contentHeight;
      return;
    }

    const heightDelta = contentHeight - lastContentHeightRef.current;
    pendingPrependRef.current = false;
    lastContentHeightRef.current = contentHeight;

    if (heightDelta > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ y: lastScrollTopRef.current + heightDelta, animated: false });
      });
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
          {t("Mahadasha & Antardasha")} {t("Chart")}
        </Text>
        {loadedRangeLabel ? <Text style={styles.rangeText}>{loadedRangeLabel}</Text> : null}
      </View>

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
          ) : error || validationMessage ? (
            <View style={styles.tableState}>
              <Text style={styles.validation}>{t(error || validationMessage)}</Text>
            </View>
          ) : (
            <ScrollView
              ref={listRef}
              nestedScrollEnabled
              persistentScrollbar
              showsVerticalScrollIndicator
              onScroll={onScroll}
              onContentSizeChange={onContentSizeChange}
              scrollEventThrottle={80}
            >
              <RangeStatus loading={isLoadingPrevious} label="Loading previous Dasha..." />
              {visibleRows.map((item) => (
                <DashaTableRow key={item.id} row={item} active={isTodayInRow(item)} language={language} />
              ))}
              <RangeStatus loading={isLoadingNext} label="Loading next Dasha..." />
            </ScrollView>
          )}
        </View>
      </View>
    </View>
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

function RangeStatus({ loading, label }: { loading: boolean; label: string }) {
  const { t } = useTranslation();
  if (!loading) return null;
  return (
    <View style={styles.rangeStatus}>
      <ActivityIndicator size="small" />
      <Text style={styles.loadingText}>{t(label)}</Text>
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
  const trimmedValue = value.trim();
  const match = trimmedValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) {
    const isoMatch = trimmedValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!isoMatch) return null;
    const [, isoYear, isoMonth, isoDay] = isoMatch;
    return parseDisplayDate(`${isoDay}-${isoMonth}-${isoYear}`);
  }
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

function normalizeDashaDate(value?: string) {
  const parsed = parseDisplayDate(value);
  return parsed ? formatDisplayDate(parsed) : value || "";
}

function compactDate(value: string) {
  const parsed = parseDisplayDate(value);
  if (!parsed) return value;
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
}

function compareDates(a: Date, b: Date) {
  return stripTime(a).getTime() - stripTime(b).getTime();
}

function validateDates(dobDate: Date | null) {
  if (!dobDate) return "Please select a valid Date of Birth.";
  if (compareDates(dobDate, maxToDate) > 0) return "Date of Birth cannot be later than 31-12-2060.";
  return "";
}

function flattenDashaRows(mahadashas: DashaMahadashaItem[] = [], selectedFromDate: Date, selectedToDate: Date) {
  const rows = mahadashas.flatMap((mahadasha, mahaIndex) =>
    (mahadasha.antardashas || []).map((antardasha, antarIndex) => {
      const fromDate = normalizeDashaDate(antardasha.startDate);
      const toDate = normalizeDashaDate(antardasha.endDate);
      const startDate = parseDisplayDate(fromDate);
      const endDate = parseDisplayDate(toDate);
      return {
        id: `${mahaIndex}-${antarIndex}-${fromDate}-${toDate}`,
        fromDate,
        toDate,
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

function getInitialYearWindow(dobDate: Date, toDate: Date): YearWindow {
  const minYear = getMinimumYear(dobDate);
  const maxYear = toDate.getFullYear();
  const anchorYear = clampYear(new Date().getFullYear(), minYear, maxYear);
  let startYear = Math.max(minYear, anchorYear - windowRadius);
  let endYear = Math.min(maxYear, anchorYear + windowRadius);

  if (endYear - startYear + 1 < windowYears) {
    if (startYear === minYear) endYear = Math.min(maxYear, startYear + windowYears - 1);
    if (endYear === maxYear) startYear = Math.max(minYear, endYear - windowYears + 1);
  }

  return { startYear, endYear };
}

function getRowsForYearWindow(rows: DashaRow[], window: YearWindow) {
  const windowStart = new Date(window.startYear, 0, 1).getTime();
  const windowEnd = new Date(window.endYear, 11, 31).getTime();
  return rows.filter((row) => row.startTimestamp <= windowEnd && row.endTimestamp >= windowStart);
}

function getMinimumYear(dobDate: Date | null) {
  return dobDate ? dobDate.getFullYear() : 0;
}

function clampYear(year: number, minYear: number, maxYear: number) {
  return Math.min(maxYear, Math.max(minYear, year));
}

function loadingIndicatorHeight(visible: boolean) {
  return visible ? 44 : 0;
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
  titleWrap: { minHeight: 118, borderRadius: 6, backgroundColor: "#bff2c6", alignItems: "flex-start", justifyContent: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 8, shadowColor: "#0d5a1d", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 5, elevation: 4 },
  title: { width: "100%", color: "#145c24", fontSize: 20, lineHeight: 32, fontWeight: "900", textAlign: "left", writingDirection: "ltr", includeFontPadding: true },
  rangeText: { color: "#375c34", fontSize: 12, lineHeight: 17, fontWeight: "900" },
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
  rangeStatus: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: "#fffdf5" },
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
