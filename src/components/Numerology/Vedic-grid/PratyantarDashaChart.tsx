import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
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
  startTimestamp: number;
  endTimestamp: number;
};

type PratyantarRange = {
  fromDate: string;
  date: Date;
  data: PratyantarRow[];
};

type LoadDirection = "initial" | "previous" | "next";

const defaultYears = 10;
const initialFromDate = new Date(2021, 0, 1);
const maxForwardFromDate = new Date(2051, 0, 1);
const rowHeight = 38;
const scrollThreshold = rowHeight * 2;

export function PratyantarDashaChart({ dateOfBirth }: { dateOfBirth?: string }) {
  const { language, t } = useTranslation();
  const listRef = useRef<ScrollView>(null);
  const loadedFromDatesRef = useRef<Set<string>>(new Set());
  const inFlightFromDatesRef = useRef<Set<string>>(new Set());
  const lastContentHeightRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const pendingPrependRef = useRef(false);
  const { height } = useWindowDimensions();
  const dobDate = useMemo(() => normalizeDate(dateOfBirth), [dateOfBirth]);
  const dobKey = useMemo(() => (dobDate ? formatDisplayDate(dobDate) : ""), [dobDate]);
  const [ranges, setRanges] = useState<PratyantarRange[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [initialError, setInitialError] = useState("");
  const [previousError, setPreviousError] = useState("");
  const [nextError, setNextError] = useState("");

  const validationMessage = useMemo(() => {
    if (!dobDate) return "Please select a valid Date of Birth.";
    return "";
  }, [dobDate]);

  const rows = useMemo(() => mergePratyantarRows(ranges.flatMap((range) => range.data)), [ranges]);
  const earliestRange = ranges[0];
  const latestRange = ranges[ranges.length - 1];
  const loadedRangeLabel = useMemo(() => {
    if (!earliestRange || !latestRange) return `${t("Years")}: ${defaultYears}`;
    return `${localizeDigitsInText(earliestRange.fromDate, language)} - ${localizeDigitsInText(latestRange.fromDate, language)} | ${t("Years")}: ${localizeDigitsInText(defaultYears, language)}`;
  }, [earliestRange, language, latestRange, t]);
  const tableMaxHeight = Math.min(430, Math.round(height * 0.46));
  const tableBodyHeight = isInitialLoading || initialError || validationMessage
    ? 130
    : Math.min(tableMaxHeight, Math.max(rowHeight, rows.length * rowHeight + loadingIndicatorHeight(isLoadingPrevious || !!previousError) + loadingIndicatorHeight(isLoadingNext || !!nextError)));

  const loadRange = useCallback(async (fromDate: Date, direction: LoadDirection) => {
    if (!dobDate) return;

    const normalizedFromDate = normalizeFromDate(fromDate, dobDate);
    const fromDateKey = formatDisplayDate(normalizedFromDate);
    if (loadedFromDatesRef.current.has(fromDateKey) || inFlightFromDatesRef.current.has(fromDateKey)) return;

    if (direction === "previous") {
      setIsLoadingPrevious(true);
      setPreviousError("");
    } else if (direction === "next") {
      setIsLoadingNext(true);
      setNextError("");
    } else {
      setIsInitialLoading(true);
      setInitialError("");
    }

    inFlightFromDatesRef.current.add(fromDateKey);

    try {
      const response = await getPratyantarDasha(formatDisplayDate(dobDate), fromDateKey, defaultYears);
      const rangeRows = response
        .map(mapPratyantarRow)
        .filter((row) => row.fromDate || row.toDate)
        .filter((row) => isRowOnOrAfterDob(row, dobDate));

      loadedFromDatesRef.current.add(fromDateKey);
      if (direction === "previous" && rangeRows.length) {
        pendingPrependRef.current = true;
      }
      setRanges((currentRanges) => {
        if (currentRanges.some((range) => range.fromDate === fromDateKey)) return currentRanges;

        return [
          ...currentRanges,
          {
            fromDate: fromDateKey,
            date: normalizedFromDate,
            data: rangeRows
          }
        ].sort((a, b) => compareDates(a.date, b.date));
      });

      if (direction === "initial" && !rangeRows.length) {
        setInitialError("No Pratyantar Dasha data is available for the selected range.");
      }
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to generate Pratyantar Dasha chart.");
      if (direction === "previous") setPreviousError(message);
      else if (direction === "next") setNextError(message);
      else setInitialError(message);
    } finally {
      inFlightFromDatesRef.current.delete(fromDateKey);
      if (direction === "previous") setIsLoadingPrevious(false);
      else if (direction === "next") setIsLoadingNext(false);
      else setIsInitialLoading(false);
    }
  }, [dobDate]);

  useEffect(() => {
    loadedFromDatesRef.current = new Set();
    inFlightFromDatesRef.current = new Set();
    lastContentHeightRef.current = 0;
    lastScrollTopRef.current = 0;
    pendingPrependRef.current = false;
    setRanges([]);
    setInitialError("");
    setPreviousError("");
    setNextError("");
    if (!dobDate) return;
    loadRange(getInitialFromDate(dobDate), "initial");
  }, [dobDate, dobKey, loadRange]);

  const loadPreviousRange = useCallback(() => {
    if (!dobDate || !earliestRange || isLoadingPrevious || isInitialLoading) return;
    const previousFromDate = getPreviousFromDate(earliestRange.date, dobDate);
    if (!previousFromDate) return;
    void loadRange(previousFromDate, "previous");
  }, [dobDate, earliestRange, isInitialLoading, isLoadingPrevious, loadRange]);

  const loadNextRange = useCallback(() => {
    if (!latestRange || isLoadingNext || isInitialLoading) return;
    const nextFromDate = getNextFromDate(latestRange.date);
    if (!nextFromDate) return;
    void loadRange(nextFromDate, "next");
  }, [isInitialLoading, isLoadingNext, latestRange, loadRange]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    lastScrollTopRef.current = contentOffset.y;
    lastContentHeightRef.current = contentSize.height;

    if (contentOffset.y <= scrollThreshold) {
      loadPreviousRange();
    }

    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - scrollThreshold) {
      loadNextRange();
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
          {t("Pratyantar Dasha")} {t("Chart")}
        </Text>
        <Text style={styles.rangeText}>{loadedRangeLabel}</Text>
      </View>

      {validationMessage ? <Text style={styles.validation}>{t(validationMessage)}</Text> : null}

      <View style={styles.table}>
        <TableHeader />
        <View style={[styles.tableBody, { height: tableBodyHeight }]}>
          {isInitialLoading ? (
            <View style={styles.tableState}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>{t("Loading")}</Text>
            </View>
          ) : initialError || validationMessage ? (
            <View style={styles.tableState}>
              <Text style={styles.validation}>{t(initialError || validationMessage)}</Text>
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
              <RangeStatus
                loading={isLoadingPrevious}
                error={previousError}
                loadingLabel="Loading previous Pratyantardasha..."
                onRetry={loadPreviousRange}
              />
              {rows.map((item) => (
                <TableRow key={item.id} row={item} language={language} />
              ))}
              <RangeStatus
                loading={isLoadingNext}
                error={nextError}
                loadingLabel="Loading next Pratyantardasha..."
                onRetry={loadNextRange}
              />
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
      <View style={[styles.stackedHeaderCell, styles.pratyantarCol]}>
        <Text style={styles.headerText}>{t("Pratyantar")}{'\n'}{t("Dasha")}</Text>
      </View>
    </View>
  );
}

function RangeStatus({ loading, error, loadingLabel, onRetry }: { loading: boolean; error: string; loadingLabel: string; onRetry: () => void }) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <View style={styles.rangeStatus}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>{t(loadingLabel)}</Text>
      </View>
    );
  }

  if (!error) return null;

  return (
    <Pressable style={styles.rangeStatus} onPress={onRetry}>
      <Text style={styles.validation}>{t(error)}</Text>
      <Text style={styles.retryText}>{t("Tap to retry")}</Text>
    </Pressable>
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
  const startDate = parseDisplayDate(fromDate);
  const endDate = parseDisplayDate(toDate);
  return {
    id: `${item.calculationYear || index}-${fromDate}-${toDate}-${item.pratyantarDashaNumber || "-"}`,
    fromDate,
    toDate,
    pratyantarDashaNumber: item.pratyantarDashaNumber,
    startTimestamp: startDate?.getTime() ?? NaN,
    endTimestamp: endDate?.getTime() ?? NaN
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

function getInitialFromDate(dobDate: Date) {
  return normalizeFromDate(initialFromDate, dobDate);
}

function getPreviousFromDate(currentFromDate: Date, dobDate: Date) {
  if (compareDates(currentFromDate, dobDate) <= 0) return null;

  const previousFromDate = addYears(currentFromDate, -defaultYears);
  if (compareDates(previousFromDate, dobDate) < 0) return dobDate;
  return previousFromDate;
}

function getNextFromDate(currentFromDate: Date) {
  const nextFromDate = addYears(currentFromDate, defaultYears);
  if (compareDates(nextFromDate, maxForwardFromDate) > 0) return null;
  return nextFromDate;
}

function normalizeFromDate(fromDate: Date, dobDate: Date) {
  if (compareDates(fromDate, dobDate) < 0) return dobDate;
  return stripTime(fromDate);
}

function addYears(date: Date, years: number) {
  return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
}

function isRowOnOrAfterDob(row: PratyantarRow, dobDate: Date) {
  if (!Number.isFinite(row.startTimestamp)) return false;
  return row.startTimestamp >= dobDate.getTime();
}

function mergePratyantarRows(nextRows: PratyantarRow[]) {
  const unique = new Map<string, PratyantarRow>();
  nextRows
    .filter((row) => Number.isFinite(row.startTimestamp))
    .sort((a, b) => a.startTimestamp - b.startTimestamp)
    .forEach((row) => {
      const key = `${row.fromDate}-${row.toDate}-${row.pratyantarDashaNumber ?? "-"}`;
      if (!unique.has(key)) unique.set(key, row);
    });

  return Array.from(unique.values());
}

function loadingIndicatorHeight(visible: boolean) {
  return visible ? 44 : 0;
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
  titleWrap: { minHeight: 118, borderRadius: 6, backgroundColor: "#bff2c6", alignItems: "flex-start", justifyContent: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 7, shadowColor: "#0d5a1d", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 5, elevation: 3 },
  title: { width: "100%", color: "#145c24", fontSize: 19, lineHeight: 25, fontWeight: "900", textAlign: "left", writingDirection: "ltr", includeFontPadding: true },
  rangeText: { color: "#375c34", fontSize: 12, lineHeight: 17, fontWeight: "900" },
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
  rangeStatus: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: "#efefef" },
  retryText: { marginTop: 2, color: "#375c34", fontSize: 11, lineHeight: 15, fontWeight: "900", textAlign: "center" },
  bodyRow: { height: rowHeight, flexDirection: "row", backgroundColor: "#efefef" },
  bodyCell: { borderTopWidth: 1, borderRightWidth: 1, borderColor: "#d6dfc9", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  dateSubCol: { width: "50%" },
  fromCol: { width: "30%" },
  toCol: { width: "30%" },
  pratyantarCol: { width: "40%", borderRightWidth: 0 },
  cellText: { color: "#000", fontSize: 12, lineHeight: 14, fontWeight: "900", textAlign: "center" },
  accentText: { color: "#000" }
});
