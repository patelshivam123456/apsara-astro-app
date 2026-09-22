import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguageSelector } from "@/components/LanguageSelector";
import { EmptyState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { generateMatchMakingPdf, MatchMakingReportResponse } from "@/services/kundali.service";
import { useMatchMakingStore } from "@/store/matchMaking.store";

type ReportType = "others" | "horoscopeCharts";
type TableCell = string | { image?: string; text: string };
type DashaLevel = "maha" | "antar" | "pratyantar" | "sookshma" | "prana";
type DashaNames = Partial<Record<DashaLevel, string>>;

const otherSectionColumns: Record<string, string[]> = {
  ashtakootmilan: ["koot", "person1", "person2", "points_obtained", "area_of_life", "description", "max_points"],
  dashakootmilan: ["koot", "person1", "person2", "points_obtained", "area_of_life", "result", "max_points"],
  navpanchamyoga: ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Rahu", "Ketu", "Ascendant"],
  planetarypositions: ["name", "awastha", "full_degree", "house", "is_combusted", "is_retro", "karakamsha", "longitude", "lord_of", "nakshatra", "nakshatra_lord", "nakshatra_no", "nakshatra_pada", "rashi_lord", "sign", "sign_no", "speed", "sub_lord", "type"],
  vimshottaridasha: ["maha_dasha", "antar_dasha", "pratyantar_dasha", "sookshma_dasha", "prana_dasha", "start_time", "end_time"]
};

export function MatchMakingPdfResultScreen() {
  const { language, t } = useTranslation();
  const result = useMatchMakingStore((state) => state.result);
  const request = useMatchMakingStore((state) => state.request);
  const setResult = useMatchMakingStore((state) => state.setResult);
  const [activeReport, setActiveReport] = useState<ReportType>("others");
  const [activeOtherSection, setActiveOtherSection] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  const currentData = activeReport === "others" ? result?.others : result?.horoscopeCharts;
  const reportSections = useMemo(() => buildVisibleSections(currentData, activeReport), [activeReport, currentData]);
  const selectedOtherSection = activeReport === "others"
    ? reportSections.find((section) => section.title === activeOtherSection) || reportSections[0]
    : undefined;

  useEffect(() => {
    if (!request || request.languageCode === language) return;

    let mounted = true;
    const nextRequest = {
      ...request,
      language,
      languageCode: language
    };

    Promise.resolve()
      .then(() => {
        if (!mounted) return null;
        setRefreshing(true);
        setRefreshError("");
        return generateMatchMakingPdf(nextRequest);
      })
      .then((response) => {
        if (mounted && response) setResult(response, nextRequest);
      })
      .catch((error) => {
        if (mounted) setRefreshError(getApiErrorMessage(error, "Unable to generate response for selected language"));
      })
      .finally(() => {
        if (mounted) setRefreshing(false);
      });

    return () => {
      mounted = false;
    };
  }, [language, request, setResult]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact style={styles.headerAction} onPress={() => router.back()}>
          {t("Back")}
        </Button>
        <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
          {t("Match Making PDF")}
        </Text>
        <LanguageSelector />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text variant="headlineSmall" style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Match Making PDF Result")}</Text>
          <Text style={styles.subtitle}>{request ? formatMatchLine(request) : t("Match making details")}</Text>
        </View>
        {refreshing ? <Text style={styles.muted}>{t("Loading response for selected language")}</Text> : null}
        {refreshError ? <Text style={styles.errorText}>{t(refreshError)}</Text> : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {(["others", "horoscopeCharts"] as const).map((tab) => (
            <Pressable key={tab} style={[styles.tab, activeReport === tab && styles.tabActive]} onPress={() => setActiveReport(tab)}>
              <Text style={[styles.tabText, activeReport === tab && styles.tabTextActive]}>{t(tab === "others" ? "Others" : "Horoscope-chart")}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {!result ? (
          <EmptyState title="No Match Making result" description="Please submit match making details first." />
        ) : (
          <>
            {request ? <MatchSummary request={request} /> : null}
            {activeReport === "others" ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabs}>
                  {reportSections.map((section) => {
                    const selected = (selectedOtherSection?.title || "") === section.title;
                    return (
                      <Pressable
                        key={section.title}
                        style={[styles.sectionTab, selected && styles.sectionTabActive]}
                        onPress={() => setActiveOtherSection(section.title)}
                      >
                        <Text style={[styles.sectionTabText, selected && styles.sectionTabTextActive]}>{formatKey(section.title)}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {selectedOtherSection ? (
                  <View style={styles.card}>
                    <OthersSectionContent title={selectedOtherSection.title} value={selectedOtherSection.value} />
                  </View>
                ) : null}
              </>
            ) : (
              reportSections.map((section, index) => (
                <View key={`${section.title}-${index}`} style={styles.card}>
                  <Text variant="titleLarge" style={styles.cardTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>
                    {formatKey(section.title)}
                  </Text>
                  <HoroscopeChartSection title={section.title} value={section.value} />
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MatchSummary({ request }: { request: NonNullable<ReturnType<typeof useMatchMakingStore.getState>["request"]> }) {
  return (
    <View style={styles.summaryCard}>
      <PersonSummary
        title="Person 1"
        name={request.p1FullName}
        date={`${request.p1Day}-${request.p1Month}-${request.p1Year}`}
        time={`${request.p1Hour}:${request.p1Min}`}
        place={request.p1Place}
      />
      <View style={styles.matchBadge}>
        <Text style={styles.matchBadgeText}>MATCH</Text>
      </View>
      <PersonSummary
        title="Person 2"
        name={request.p2FullName}
        date={`${request.p2Day}-${request.p2Month}-${request.p2Year}`}
        time={`${request.p2Hour}:${request.p2Min}`}
        place={request.p2Place}
      />
    </View>
  );
}

function PersonSummary({
  date,
  name,
  place,
  time,
  title
}: {
  date: string;
  name: string;
  place: string;
  time: string;
  title: string;
}) {
  return (
    <View style={styles.personSummary}>
      <Text style={styles.personKicker}>{title}</Text>
      <Text style={styles.personName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{name || "-"}</Text>
      <Text style={styles.personMeta} numberOfLines={1}>{date} | {time}</Text>
      <Text style={styles.personPlace} numberOfLines={2}>{place || "-"}</Text>
    </View>
  );
}

function formatMatchLine(request: NonNullable<ReturnType<typeof useMatchMakingStore.getState>["request"]>) {
  return [request.p1FullName, request.p2FullName].filter(Boolean).join(" & ") || "Match making details";
}

function OthersSectionContent({ title, value }: { title: string; value: unknown }) {
  const sectionType = normalizeSectionKey(title);

  if (sectionType.includes("basicastrodetails") || sectionType.includes("manglikdosha")) {
    const pair = getPersonPair(value);
    if (pair) {
      const contentRows = flattenKeyValueRows(getExtraPairContent(value), "Content");
      return (
        <View style={styles.valueGroup}>
          <PersonPairTabs first={pair.p1} second={pair.p2} />
          {contentRows.length ? <SingleDataTable columns={["Details", "Value"]} rows={contentRows} /> : null}
        </View>
      );
    }
  }

  if (sectionType.includes("navpancham")) {
    const planetTables = buildPlanetTables(value, otherSectionColumns.navpanchamyoga);
    if (planetTables.length) {
      return (
        <View style={styles.planetGrid}>
          {planetTables.map((table) => (
            <View key={table.title} style={styles.planetMiniCard}>
              <Text style={styles.planetBadge}>{formatKey(table.title)}</Text>
              <SingleDataTable columns={table.columns} rows={table.rows} />
            </View>
          ))}
        </View>
      );
    }
  }

  const columns = otherSectionColumns[sectionType];
  if (columns) {
    if (sectionType === "vimshottaridasha") {
      return <VimshottariDashaContent value={value} />;
    }
    return <SingleDataTable columns={columns} rows={buildSectionRows(value, columns, sectionType)} />;
  }

  return <ReportValue label={title} value={value} />;
}

function VimshottariDashaContent({ value }: { value: unknown }) {
  const pair = getPersonPair(value);
  if (pair) {
    return <PersonPairDashaTabs first={pair.p1} second={pair.p2} />;
  }

  const table = buildVimshottariTable(value);
  return table.rows.length ? <SingleDataTable columns={table.columns} rows={table.rows} /> : <ReportValue label="Vimshottari Dasha" value={value} />;
}

function PersonPairDashaTabs({ first, second }: { first: Record<string, unknown>; second: Record<string, unknown> }) {
  const [activePerson, setActivePerson] = useState<"p1" | "p2">("p1");
  const value = activePerson === "p1" ? first : second;
  const table = buildVimshottariTable(value);

  return (
    <View style={styles.valueGroup}>
      <View style={styles.personTabs}>
        <Pressable style={[styles.personTab, activePerson === "p1" && styles.personTabActive]} onPress={() => setActivePerson("p1")}>
          <Text style={[styles.personTabText, activePerson === "p1" && styles.personTabTextActive]}>Person 1</Text>
        </Pressable>
        <Pressable style={[styles.personTab, activePerson === "p2" && styles.personTabActive]} onPress={() => setActivePerson("p2")}>
          <Text style={[styles.personTabText, activePerson === "p2" && styles.personTabTextActive]}>Person 2</Text>
        </Pressable>
      </View>
      {table.rows.length ? <SingleDataTable columns={table.columns} rows={table.rows} /> : <ReportValue label={activePerson === "p1" ? "Person 1" : "Person 2"} value={value} />}
    </View>
  );
}

function PersonPairTabs({ first, second }: { first: Record<string, unknown>; second: Record<string, unknown> }) {
  const [activePerson, setActivePerson] = useState<"p1" | "p2">("p1");
  const value = activePerson === "p1" ? first : second;

  return (
    <>
      <View style={styles.personTabs}>
        <Pressable style={[styles.personTab, activePerson === "p1" && styles.personTabActive]} onPress={() => setActivePerson("p1")}>
          <Text style={[styles.personTabText, activePerson === "p1" && styles.personTabTextActive]}>Person 1</Text>
        </Pressable>
        <Pressable style={[styles.personTab, activePerson === "p2" && styles.personTabActive]} onPress={() => setActivePerson("p2")}>
          <Text style={[styles.personTabText, activePerson === "p2" && styles.personTabTextActive]}>Person 2</Text>
        </Pressable>
      </View>
      <PersonDetailCard title={activePerson === "p1" ? "Person 1" : "Person 2"} value={value} />
    </>
  );
}

function PersonDetailCard({ title, value }: { title: string; value: Record<string, unknown> }) {
  const rows = Object.entries(value)
    .filter(([key, item]) => !isImageEntry(key, item));

  return (
    <View style={styles.personDetailCard}>
      <Text style={styles.valueLabel}>{title}</Text>
      {rows.length ? rows.map(([key, item]) => (
        <View key={key} style={styles.detailTile}>
          <Text style={styles.detailLabel}>{formatKey(key)}</Text>
          {Array.isArray(item) || isRecord(item) ? (
            <SingleDataTable {...buildSingleSectionTable(item, key)} />
          ) : (
            <Text style={styles.detailValue}>{stringifyFlatValue(item)}</Text>
          )}
        </View>
      )) : (
        <View style={styles.detailTile}>
          <Text style={styles.detailLabel}>Details</Text>
          <Text style={styles.detailValue}>-</Text>
        </View>
      )}
    </View>
  );
}

function normalizeSectionKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getPersonPair(value: unknown) {
  if (!isRecord(value)) return null;

  if (isRecord(value.p1) && isRecord(value.p2)) return { p1: value.p1, p2: value.p2 };
  if (isRecord(value.person1) && isRecord(value.person2)) return { p1: value.person1, p2: value.person2 };
  if (isRecord(value.Person1) && isRecord(value.Person2)) return { p1: value.Person1, p2: value.Person2 };

  const entries = Object.entries(value);
  const first = entries.find(([key]) => /^(p1|person[_\s-]?1|boy|male)$/i.test(key));
  const second = entries.find(([key]) => /^(p2|person[_\s-]?2|girl|female)$/i.test(key));

  if (first && second && isRecord(first[1]) && isRecord(second[1])) {
    return { p1: first[1], p2: second[1] };
  }

  return null;
}

function getExtraPairContent(value: unknown) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !/^(p1|p2|person[_\s-]?1|person[_\s-]?2|person1|person2|boy|girl|male|female)$/i.test(key))
  );
}

function buildPlanetTables(value: unknown, columns: string[]) {
  if (!isRecord(value)) return [];

  return Object.entries(value)
    .filter(([, item]) => isRecord(item) || Array.isArray(item))
    .map(([title, item]) => {
      return { title, columns, rows: buildRowsForColumns(item, columns, normalizeSectionKey(title)) };
    })
    .filter((table) => table.rows.length);
}

function ReportValue({ label, value }: { label?: string; value: unknown }) {
  const images = collectImages(value, label);
  const table = buildSingleSectionTable(value, label);

  return (
    <View style={styles.valueGroup}>
      {images.map((image, index) => (
        <View key={`${image.label}-${index}`} style={styles.imageBlock}>
          <Text style={styles.valueLabel}>{formatKey(image.label)}</Text>
          <RemoteImage value={image.value} />
        </View>
      ))}
      {table.rows.length ? <SingleDataTable columns={table.columns} rows={table.rows} /> : null}
    </View>
  );
}

function HoroscopeChartSection({ title, value }: { title: string; value: unknown }) {
  const charts = collectPersonCharts(value);

  if (!charts.length) return <ReportValue label={title} value={value} />;
  const rows = charts.flatMap((chart) => chart.rows);

  return (
    <View style={styles.valueGroup}>
      {charts.map((chart) => (
        <View key={`${chart.person}-${chart.name}`} style={styles.chartBlock}>
          <Text style={styles.valueLabel}>{chart.person}</Text>
          <RemoteImage value={chart.svg} />
        </View>
      ))}
      <SingleDataTable columns={["Person", "Name", "Symbol"]} rows={rows} />
    </View>
  );
}

function collectPersonCharts(value: unknown): { name: string; person: string; rows: TableCell[][]; svg: string }[] {
  if (!isRecord(value)) return [];

  const entries = Object.entries(value);
  const directPersonEntries = entries.filter(([key, item]) => isRecord(item) && (/^(p1|person[_\s-]?1)$/i.test(key) || /^(p2|person[_\s-]?2)$/i.test(key)));

  if (directPersonEntries.length) {
    return directPersonEntries.flatMap(([key, item]) => chartBlocksFromRecord(personLabelFromKey(key), item as Record<string, unknown>));
  }

  const blocks = chartBlocksFromRecord("", value);
  if (blocks.length) return blocks;

  return entries.flatMap(([key, item]) => (
    isRecord(item) ? chartBlocksFromRecord(formatKey(key), item) : []
  ));
}

function chartBlocksFromRecord(personFallback: string, record: Record<string, unknown>) {
  const svg = getSvgImage(record);
  if (!svg) return [];

  const person = personFallback || stringifyFlatValue(record.person || record.person_name) || "Person";
  const rows = buildChartPlanetRows(record, person);
  return [{ name: stringifyFlatValue(record.name || person), person, rows, svg }];
}

function buildChartPlanetRows(record: Record<string, unknown>, person: string): TableCell[][] {
  const source =
    Array.isArray(record.planets) ? record.planets :
    Array.isArray(record.planet) ? record.planet :
    isRecord(record.planets) ? Object.values(record.planets) :
    isRecord(record.planet) ? Object.values(record.planet) :
    isRecord(record.data) ? Object.values(record.data) :
    [];

  const rows = source.flatMap((item) => collectChartPlanetRecords(item)).map((item) => [
    person,
    stringifyFlatValue(getPlanetField(item, "name")),
    stringifyFlatValue(getPlanetField(item, "symbol"))
  ]);

  return rows.length ? rows : [[person, stringifyFlatValue(getPlanetField(record, "name") || person), stringifyFlatValue(getPlanetField(record, "symbol"))]];
}

function collectChartPlanetRecords(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(collectChartPlanetRecords);
  if (!isRecord(value)) return [];
  if (getPlanetField(value, "name") !== undefined || getPlanetField(value, "symbol") !== undefined) return [value];
  return Object.values(value).flatMap(collectChartPlanetRecords);
}

function getPlanetField(record: Record<string, unknown>, field: "name" | "symbol") {
  const aliases = field === "name"
    ? ["name", "planetname", "planet_name", "planetName"]
    : ["symbol", "planetsymbol", "planet_symbol", "planetSymbol", "shortname", "short_name"];
  const found = Object.entries(record).find(([key]) => aliases.map(normalizeSectionKey).includes(normalizeSectionKey(key)));
  return found?.[1];
}

function getSvgImage(record: Record<string, unknown>) {
  const candidates = [record.svg, record.base64_image, record.image, record.chart].filter((item): item is string => typeof item === "string");
  return candidates.find((item) => item.trim().startsWith("<svg") || item.trim().startsWith("data:image/svg") || /\.svg(\?|#|$)/i.test(item.trim())) || "";
}

function personLabelFromKey(key: string) {
  return /1/.test(key) || /^p1$/i.test(key) ? "Person 1" : "Person 2";
}

function SingleDataTable({ columns, rows }: { columns: string[]; rows: TableCell[][] }) {
  const widths = columns.map((column, index) => getMatchColumnWidth(column, rows.map((row) => cellText(row[index]))));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.gridTable}>
        <View style={styles.gridRow}>
          {columns.map((column, index) => (
            <Text key={column} style={[styles.gridHeadCell, { width: widths[index] }]}>{formatKey(column)}</Text>
          ))}
        </View>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {columns.map((column, columnIndex) => (
              <TableCellView key={`${rowIndex}-${column}`} value={row[columnIndex]} width={widths[columnIndex]} />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function TableCellView({ value, width }: { value: TableCell | undefined; width: number }) {
  if (isImageCell(value)) {
    return (
      <View style={[styles.gridCell, styles.imageNameCell, { width }]}>
        {value.image ? <Image source={{ uri: normalizeImageUri(value.image) }} style={styles.inlineIcon} contentFit="contain" /> : null}
        <Text style={styles.gridCellText}>{value.text || "-"}</Text>
      </View>
    );
  }

  return <Text style={[styles.gridCell, { width }]}>{cellText(value) || "-"}</Text>;
}

function buildSingleSectionTable(value: unknown, label?: string) {
  if (isMissingApiValue(value)) {
    return {
      columns: ["Details", "Value"],
      rows: [[formatKey(label || "Value"), "-"]]
    };
  }

  if (Array.isArray(value) && value.every(isRecord)) {
    const columns = Array.from(new Set(value.flatMap((row) => Object.keys(row).filter((key) => !isImageEntry(key, row[key])))));
    return {
      columns: columns.length ? columns : ["Value"],
      rows: value.map((row) => columns.map((column) => stringifyFlatValue(row[column])))
    };
  }

  if (isRecord(value) && isRecord(value.p1) && isRecord(value.p2)) {
    const p1 = value.p1;
    const p2 = value.p2;
    const fields = Array.from(new Set([...Object.keys(p1), ...Object.keys(p2)].filter((key) => !isImageEntry(key, p1[key]) && !isImageEntry(key, p2[key]))));
    return {
      columns: ["Details", "Person 1", "Person 2"],
      rows: fields.map((field) => [formatKey(field), stringifyFlatValue(p1[field]), stringifyFlatValue(p2[field])])
    };
  }

  const rows = flattenKeyValueRows(value, label || "Value");
  return {
    columns: ["Details", "Value"],
    rows
  };
}

function buildRowsForColumns(value: unknown, columns: string[], sectionType: string): TableCell[][] {
  const records = collectDataRecords(value, columns);
  if (!records.length && isRecord(value)) return [columns.map((column) => getColumnCell(value, column, sectionType))];
  return records.map((record) => columns.map((column) => getColumnCell(record, column, sectionType)));
}

function buildSectionRows(value: unknown, columns: string[], sectionType: string): TableCell[][] {
  if (sectionType === "vimshottaridasha") {
    const rows = flattenVimshottariRows(value);
    if (rows.length) return rows;
  }

  return buildRowsForColumns(value, columns, sectionType);
}

function buildVimshottariTable(value: unknown) {
  const columns = otherSectionColumns.vimshottaridasha;
  const rows = buildSectionRows(value, columns, "vimshottaridasha");
  const visibleIndexes = columns
    .map((column, index) => ({ column, index }))
    .filter(({ column, index }) => {
      if (!["sookshma_dasha", "prana_dasha"].includes(column)) return true;
      return rows.some((row) => hasDisplayValue(row[index]));
    });

  return {
    columns: visibleIndexes.map(({ column }) => column),
    rows: rows.map((row) => visibleIndexes.map(({ index }) => row[index]))
  };
}

function collectDataRecords(value: unknown, columns: string[], parentKey = ""): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    const recordRows = value.filter(isRecord);
    if (recordRows.length === value.length) return recordRows;
    return value.flatMap((item, index) => collectDataRecords(item, columns, String(index + 1)));
  }

  if (!isRecord(value)) return [];

  const directMatches = columns.filter((column) => getRecordValue(value, column) !== undefined).length;
  if (directMatches >= Math.min(2, columns.length)) return [{ __key: parentKey, ...value }];

  return Object.entries(value).flatMap(([key, item]) => collectDataRecords(item, columns, key));
}

function getColumnCell(record: Record<string, unknown>, column: string, sectionType: string): TableCell {
  const value = getRecordValue(record, column);
  const normalizedColumn = normalizeSectionKey(column);
  if (normalizedColumn === "koot") return stringifyFlatValue(value ?? record.__key);
  if (normalizedColumn === "maxpoints") {
    return stringifyFlatValue(value ?? getDefaultMaxPoints(valueForKootFallback(record), sectionType));
  }
  if (sectionType === "planetarypositions" && normalizeSectionKey(column) === "name") {
    return {
      image: stringifyFlatValue(getRecordValue(record, "image") ?? getRecordValue(record, "planet_image") ?? getRecordValue(record, "icon")),
      text: stringifyFlatValue(value)
    };
  }
  return stringifyFlatValue(value);
}

function valueForKootFallback(record: Record<string, unknown>) {
  return record.__key ?? getRecordValue(record, "koot") ?? getRecordValue(record, "name") ?? getRecordValue(record, "type");
}

function getDefaultMaxPoints(koot: unknown, sectionType: string) {
  const key = normalizeSectionKey(stringifyFlatValue(koot));
  if (sectionType === "ashtakootmilan") {
    const max: Record<string, string> = {
      varna: "1",
      vashya: "2",
      tara: "3",
      yoni: "4",
      grahamaitri: "5",
      gana: "6",
      bhakoota: "7",
      bhakoot: "7",
      nadi: "8"
    };
    return max[key];
  }

  if (sectionType === "dashakootmilan") {
    const max: Record<string, string> = {
      vashya: "2",
      yoni: "4",
      gana: "6",
      dina: "3",
      tara: "3",
      rashi: "7",
      rajju: "5",
      rasyadhipati: "5",
      rashyadhipati: "5",
      grahamaitri: "5",
      vedha: "2",
      mahendra: "2",
      streedargha: "2",
      stree: "2",
      streegarga: "2",
      streedargah: "2"
    };
    return max[key];
  }

  return undefined;
}

function flattenVimshottariRows(value: unknown): TableCell[][] {
  const rows: TableCell[][] = [];
  const source = unwrapDashaSource(value);

  const pushRow = (names: DashaNames, start: unknown, end: unknown) => {
    rows.push([
      names.maha || "--",
      names.antar || "--",
      names.pratyantar || "--",
      names.sookshma || "--",
      names.prana || "--",
      stringifyFlatValue(start),
      stringifyFlatValue(end)
    ]);
  };

  const walk = (node: unknown, names: DashaNames, dates: { start?: unknown; end?: unknown }) => {
    if (!isRecord(node)) return;
    const nextNames = { ...names, ...getDirectDashaNames(node) };
    const start = getRecordValue(node, "start_time") ?? getRecordValue(node, "start_date") ?? dates.start;
    const end = getRecordValue(node, "end_time") ?? getRecordValue(node, "end_date") ?? dates.end;
    const childGroups = getDashaChildGroups(node);

    if (!childGroups.length) {
      pushRow(nextNames, start, end);
      return;
    }

    childGroups.forEach(({ entries, level }) => {
      entries.forEach(([name, child]) => {
        walk(child, { ...nextNames, [level]: formatKey(name) }, { start, end });
      });
    });
  };

  if (Array.isArray(source)) {
    const flatRows = buildRowsForColumns(source, otherSectionColumns.vimshottaridasha, "vimshottaridasha");
    const hasNestedDasha = source.some((item) => isRecord(item) && getDashaChildGroups(item).length);
    if (!hasNestedDasha && flatRows.some((row) => row.some(hasDisplayValue))) return flatRows;
    source.forEach((item) => walk(item, {}, {}));
  }

  if (isRecord(source)) {
    const sourceGroups = getDashaChildGroups(source);
    if (sourceGroups.length) {
      walk(source, {}, {});
    } else {
      Object.entries(source).forEach(([name, item]) => walk(item, { maha: formatKey(name) }, {}));
    }
  }

  if (rows.length) return rows;
  return buildRowsForColumns(value, otherSectionColumns.vimshottaridasha, "vimshottaridasha");
}

function getDashaChildGroups(record: Record<string, unknown>): { level: DashaLevel; entries: [string, unknown][] }[] {
  const keys: { level: DashaLevel; keys: string[] }[] = [
    { level: "maha", keys: ["maha_dasha", "mahaDasha", "maha"] },
    { level: "antar", keys: ["antar_dasha", "antarDasha", "antar"] },
    { level: "pratyantar", keys: ["pratyantar_dasha", "pratyantarDasha", "pratyantar"] },
    { level: "sookshma", keys: ["sookshma_dasha", "sookshmaDasha", "sookshma"] },
    { level: "prana", keys: ["prana_dasha", "pranaDasha", "prana"] }
  ];

  const groups = keys.flatMap(({ keys: childKeys, level }) => {
    const childValue = childKeys.map((key) => record[key]).find((item) => isRecord(item) || Array.isArray(item));
    const entries = getDashaEntries(childValue, level);
    return entries.length ? [{ level, entries }] : [];
  });

  if (groups.length) return groups;

  return ["children", "periods", "data"].flatMap((key) => {
    const entries = getDashaEntries(record[key], nextDashaLevel(getHighestDashaLevel(getDirectDashaNames(record))));
    return entries.length ? [{ level: nextDashaLevel(getHighestDashaLevel(getDirectDashaNames(record))), entries }] : [];
  });
}

function getDashaEntries(value: unknown, level: DashaLevel): [string, unknown][] {
  if (isRecord(value)) return Object.entries(value);
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((item, index) => {
    const name = getDisplayDashaName(item, level) || getDisplayDashaName(item, "maha") || String(index + 1);
    return [name, item];
  });
}

function getDirectDashaNames(record: Record<string, unknown>): DashaNames {
  const levels: DashaLevel[] = ["maha", "antar", "pratyantar", "sookshma", "prana"];
  return levels.reduce<DashaNames>((names, level) => {
    const value = getDisplayDashaName(record, level);
    if (value) names[level] = value;
    return names;
  }, {});
}

function getDisplayDashaName(record: Record<string, unknown>, level: DashaLevel) {
  const value = getRecordValue(record, `${level}_dasha`);
  if (value === undefined || Array.isArray(value) || isRecord(value)) return "";
  const text = stringifyFlatValue(value);
  return text && text !== "-" ? text : "";
}

function getHighestDashaLevel(names: DashaNames): DashaLevel | undefined {
  return (["prana", "sookshma", "pratyantar", "antar", "maha"] as DashaLevel[]).find((level) => Boolean(names[level]));
}

function nextDashaLevel(level: DashaLevel | undefined): DashaLevel {
  const order: DashaLevel[] = ["maha", "antar", "pratyantar", "sookshma", "prana"];
  const index = level ? order.indexOf(level) : -1;
  return order[Math.min(index + 1, order.length - 1)];
}

function hasDisplayValue(value: TableCell | undefined) {
  const text = cellText(value);
  return Boolean(text && text !== "-");
}

function unwrapDashaSource(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const keys = ["maha_dasha", "mahaDasha", "vimshottari_dasha", "vimshottariDasha", "dasha", "dashas", "data"];
  const key = keys.find((item) => isRecord(value[item]) || Array.isArray(value[item]));
  return key ? value[key] : value;
}

function getRecordValue(record: Record<string, unknown>, column: string) {
  const normalizedColumn = normalizeSectionKey(column);
  const aliases = getColumnAliases(normalizedColumn);
  const found = Object.entries(record).find(([key]) => aliases.includes(normalizeSectionKey(key)));
  return found?.[1];
}

function getColumnAliases(column: string) {
  const aliases: Record<string, string[]> = {
    koot: ["koot", "koota", "kootname", "kootaname", "name", "type", "title"],
    name: ["name", "planetname"],
    symbol: ["symbol", "planetsymbol", "shortname"],
    person1: ["person1", "p1", "boy", "male"],
    person2: ["person2", "p2", "girl", "female"],
    pointsobtained: ["pointsobtained", "points", "score", "obtainedpoints"],
    areaoflife: ["areaoflife", "area", "lifearea"],
    maxpoints: ["maxpoints", "maximumpoints", "maxpoint", "maxponits", "maxponit", "totalpoints", "max", "maximum", "outof", "outofpoints"],
    mahadasha: ["mahadasha", "maha"],
    antardasha: ["antardasha", "antar"],
    pratyantardasha: ["pratyantardasha", "pratyantar"],
    sookshmadasha: ["sookshmadasha", "sookshma"],
    pranadasha: ["pranadasha", "prana"],
    starttime: ["starttime", "startdate", "start"],
    endtime: ["endtime", "enddate", "end"],
    fulldegree: ["fulldegree", "fullDegree", "degree"],
    iscombusted: ["iscombusted", "combusted"],
    isretro: ["isretro", "retro"],
    lordof: ["lordof"],
    nakshatralord: ["nakshatralord"],
    nakshatrano: ["nakshatrano", "nakshatranumber"],
    nakshatrapada: ["nakshatrapada", "pada"],
    rashilord: ["rashilord"],
    signno: ["signno", "signnumber"],
    sublord: ["sublord"]
  };

  return [column, ...(aliases[column] || [])].map(normalizeSectionKey);
}

function cellText(value: TableCell | undefined) {
  if (isImageCell(value)) return value.text;
  return stringifyFlatValue(value);
}

function isImageCell(value: TableCell | undefined): value is { image?: string; text: string } {
  return Boolean(value && typeof value === "object" && "text" in value);
}

function getMatchColumnWidth(column: string, values: string[]) {
  const key = normalizeSectionKey(column);
  const longest = [column, ...values].reduce((max, item) => Math.max(max, String(item || "").length), 0);

  if (/description|content|comment|remed|areaoflife/.test(key)) return 240;
  if (/start|end|date|time/.test(key)) return 128;
  if (/point|score|percent|year|month|day|hour|minute/.test(key)) return 104;
  if (/person|name|planet|dasha|koot|result|value|details/.test(key)) return Math.min(160, Math.max(120, longest * 7 + 28));
  if (longest <= 8) return 96;
  if (longest <= 18) return 132;
  return 180;
}

function flattenKeyValueRows(value: unknown, label: string): string[][] {
  if (isMissingApiValue(value)) return [[formatKey(label), "-"]];
  if (typeof value !== "object") return [[formatKey(label), stringifyFlatValue(value)]];

  if (Array.isArray(value)) {
    if (value.every((item) => !isRecord(item) && !Array.isArray(item))) {
      return [[formatKey(label), stringifyFlatValue(value)]];
    }
    return value.flatMap((item, index) => flattenKeyValueRows(item, `${label} ${index + 1}`));
  }

  const displayValue = getDisplayRecordValue(value);
  if (displayValue !== undefined) return [[formatKey(label), stringifyFlatValue(displayValue)]];
  if (!isRecord(value)) return [[formatKey(label), stringifyFlatValue(value)]];

  return Object.entries(value)
    .filter(([key, item]) => !isImageEntry(key, item))
    .flatMap(([key, item]) => {
      const nextLabel = label === "Value" ? key : `${label} ${key}`;
      return flattenKeyValueRows(item, nextLabel);
    });
}

function collectImages(value: unknown, label = "Chart"): { label: string; value: string }[] {
  if (typeof value === "string") return isImageValue(value, label) ? [{ label, value }] : [];
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((item, index) => collectImages(item, `${label} ${index + 1}`));

  return Object.entries(value).flatMap(([key, item]) => {
    const nextLabel = formatKey(key);
    if (typeof item === "string" && isImageValue(item, key)) return [{ label: nextLabel, value: item }];
    return collectImages(item, nextLabel);
  });
}

function stringifyFlatValue(value: unknown): string {
  if (isMissingApiValue(value)) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value).trim() || "-";
  if (Array.isArray(value)) {
    return value.map(stringifyFlatValue).filter((item) => item && item !== "-").join(", ") || "-";
  }
  const displayValue = getDisplayRecordValue(value);
  if (displayValue !== undefined) return stringifyFlatValue(displayValue);
  if (isRecord(value)) return Object.entries(value)
    .filter(([, item]) => item !== null && item !== undefined && item !== "")
    .filter(([key, item]) => !isImageEntry(key, item))
    .map(([key, item]) => `${formatKey(key)}: ${stringifyFlatValue(item)}`)
    .join(", ") || "-";

  return String(value);
}

function isMissingApiValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return !value.trim();
  if (Array.isArray(value)) return value.length === 0;
  if (isRecord(value)) {
    return Object.entries(value)
      .filter(([key, item]) => !isImageEntry(key, item))
      .every(([, item]) => isMissingApiValue(item));
  }
  return false;
}

function getDisplayRecordValue(value: unknown) {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value).filter(([, item]) => item !== null && item !== undefined && item !== "");
  if (entries.length === 1 && normalizeSectionKey(entries[0][0]) === "value") return entries[0][1];

  const valueEntry = entries.find(([key, item]) => normalizeSectionKey(key) === "value" && !Array.isArray(item) && !isRecord(item));
  const hasLabelEntry = entries.some(([key]) => /^(label|title|name|type|key)$/i.test(key));
  return valueEntry && hasLabelEntry ? valueEntry[1] : undefined;
}

function isImageEntry(key: string, value: unknown) {
  return typeof value === "string" && isImageValue(value, key);
}

function RemoteImage({ compact = false, value }: { compact?: boolean; value: string }) {
  const [uri, setUri] = useState(() => normalizeImageUri(value));

  useEffect(() => {
    let mounted = true;

    async function loadSvgUrl() {
      if (!shouldFetchAsSvg(value)) {
        setUri(normalizeImageUri(value));
        return;
      }

      try {
        const response = await fetch(value);
        const svgText = await response.text();
        if (mounted) setUri(svgText.trim().startsWith("<svg") ? toSvgDataUri(svgText) : value);
      } catch {
        if (mounted) setUri(value);
      }
    }

    loadSvgUrl();
    return () => {
      mounted = false;
    };
  }, [value]);

  return <Image source={{ uri }} style={[styles.reportImage, compact && styles.compactImage]} contentFit="contain" />;
}

function getSectionKeys(data: MatchMakingReportResponse | undefined, reportType: ReportType) {
  if (!data || typeof data !== "object") return [];
  const keys = Object.keys(data).filter((key) => data[key] !== null && data[key] !== undefined);
  if (reportType !== "horoscopeCharts") return sortOtherSectionKeys(keys);
  return [...keys].sort(compareChartKeys);
}

function sortOtherSectionKeys(keys: string[]) {
  const order = [
    "ashtakootmilan",
    "basicastrodetails",
    "dashakootmilan",
    "manglikdosha",
    "navpanchamyoga",
    "planetarypositions",
    "vimshottaridasha"
  ];

  return [...keys].sort((a, b) => {
    const first = order.indexOf(normalizeSectionKey(a));
    const second = order.indexOf(normalizeSectionKey(b));
    if (first !== -1 && second !== -1) return first - second;
    if (first !== -1) return -1;
    if (second !== -1) return 1;
    return a.localeCompare(b);
  });
}

function buildVisibleSections(data: MatchMakingReportResponse | undefined, reportType: ReportType) {
  const fallbackTitle = reportType === "others" ? "Others" : "Horoscope-chart";
  if (!data || typeof data !== "object") return [];

  const keys = getSectionKeys(data, reportType);
  if (!keys.length) return [{ title: fallbackTitle, value: data }];

  return keys.map((key) => ({
    title: key,
    value: data[key]
  }));
}

function isImageValue(value: string, label?: string) {
  const clean = value.trim();
  const labelText = String(label || "").toLowerCase();
  return (
    isSvgUrl(clean) ||
    clean.startsWith("<svg") ||
    clean.startsWith("data:image/") ||
    /\.(png|jpe?g|webp)(\?|#|$)/i.test(clean) ||
    (/^https?:\/\//i.test(clean) && /(svg|chart|image|img|kundali|horoscope)/i.test(labelText))
  );
}

function isSvgUrl(value: string) {
  return /\.svg(\?|#|$)/i.test(value.trim());
}

function shouldFetchAsSvg(value: string) {
  const clean = value.trim();
  return isSvgUrl(clean) || /^https?:\/\//i.test(clean);
}

function normalizeImageUri(value: string) {
  const clean = value.trim();
  if (clean.startsWith("<svg")) return toSvgDataUri(clean);
  return clean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function compareChartKeys(a: string, b: string) {
  const first = getChartNumber(a);
  const second = getChartNumber(b);
  if (first !== null && second !== null) return first - second;
  if (first !== null) return -1;
  if (second !== null) return 1;
  return a.localeCompare(b);
}

function getChartNumber(value: string) {
  const match = value.trim().match(/^d[\s_-]*(\d+)$/i);
  return match ? Number(match[1]) : null;
}

function toSvgDataUri(svgText: string) {
  return `data:image/svg+xml;base64,${base64EncodeUtf8(svgText)}`;
}

function base64EncodeUtf8(value: string) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = encodeUtf8(value);
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    output += chars[first >> 2];
    output += chars[((first & 3) << 4) | ((second ?? 0) >> 4)];
    output += second === undefined ? "=" : chars[((second & 15) << 2) | ((third ?? 0) >> 6)];
    output += third === undefined ? "=" : chars[third & 63];
  }

  return output;
}

function encodeUtf8(value: string) {
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      const next = value.charCodeAt(++index);
      const point = 0x10000 + (((code & 0x3ff) << 10) | (next & 0x3ff));
      bytes.push(0xf0 | (point >> 18), 0x80 | ((point >> 12) & 0x3f), 0x80 | ((point >> 6) & 0x3f), 0x80 | (point & 0x3f));
    }
  }
  return bytes;
}

function formatKey(value: string) {
  const clean = value.trim();
  if (/^p1$/i.test(clean)) return "Person 1";
  if (/^p2$/i.test(clean)) return "Person 2";
  if (/^d[\s_-]*\d+$/i.test(clean)) return clean.replace(/[\s_-]+/g, "").toUpperCase();

  return clean
    .replace(/^p1(?=[A-Z_-])/, "Person 1 ")
    .replace(/^p2(?=[A-Z_-])/, "Person 2 ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fbfbef" },
  header: { minHeight: 58, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  headerAction: { width: 86, marginLeft: -8 },
  headerTitle: { flex: 1, color: colors.ink, fontWeight: "800", textAlign: "center" },
  content: { alignSelf: "center", width: "100%", maxWidth: 1160, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.xs },
  title: { color: colors.amber, fontWeight: "900", lineHeight: 31, textAlign: "center" },
  subtitle: { color: colors.cocoa, fontSize: 12, lineHeight: 17, textAlign: "center" },
  summaryCard: { marginHorizontal: spacing.lg, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, flexDirection: "row", alignItems: "stretch", gap: spacing.sm },
  personSummary: { flex: 1, minWidth: 0, borderRadius: 8, backgroundColor: "#fffaf0", padding: spacing.md, gap: 3 },
  personKicker: { color: colors.cocoa, fontSize: 10, lineHeight: 13, fontWeight: "900" },
  personName: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "900" },
  personMeta: { color: "#8a5d00", fontSize: 11, lineHeight: 15, fontWeight: "800" },
  personPlace: { color: colors.cocoa, fontSize: 11, lineHeight: 15, fontWeight: "600" },
  matchBadge: { width: 52, borderRadius: 8, backgroundColor: "#ffd45d", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  matchBadgeText: { color: "#5f3b00", fontSize: 10, lineHeight: 13, fontWeight: "900", textAlign: "center" },
  tabs: { minHeight: 58, paddingHorizontal: spacing.lg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, alignItems: "center", gap: spacing.md },
  tab: { minWidth: 150, minHeight: 38, borderRadius: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  tabActive: { borderWidth: 1, borderColor: colors.lime, backgroundColor: "#ffffb8" },
  tabText: { color: colors.cocoa, fontWeight: "800" },
  tabTextActive: { color: colors.ink },
  sectionTabs: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: "#fffdf4" },
  sectionTab: { minHeight: 34, borderRadius: 10, backgroundColor: "#fff", paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center" },
  sectionTabActive: { backgroundColor: "#ff7f2a" },
  sectionTabText: { color: "#6b5a28", fontSize: 12, lineHeight: 16, fontWeight: "900", letterSpacing: 0.5 },
  sectionTabTextActive: { color: "#fff" },
  personTabs: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fffaf0", padding: 3, flexDirection: "row", gap: 3 },
  personTab: { flex: 1, minHeight: 38, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  personTabActive: { backgroundColor: "#ffd45d" },
  personTabText: { color: colors.cocoa, fontWeight: "800" },
  personTabTextActive: { color: colors.ink },
  card: { marginHorizontal: spacing.lg, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  cardTitle: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: "900", marginBottom: spacing.xs },
  valueGroup: { gap: spacing.sm },
  personDetailCard: { flex: 1, minWidth: 290, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", padding: spacing.md, gap: spacing.md },
  detailTile: { minHeight: 74, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", padding: spacing.md, justifyContent: "center", gap: spacing.xs },
  detailLabel: { color: "#8a6b00", fontSize: 10, lineHeight: 13, fontWeight: "900", letterSpacing: 0.9, textTransform: "uppercase" },
  detailValue: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: "800" },
  planetGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  planetMiniCard: { flex: 1, minWidth: 310, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", padding: spacing.md, gap: spacing.sm },
  planetBadge: { alignSelf: "flex-start", borderRadius: 12, backgroundColor: "#ff7f2a", color: "#fff", fontSize: 11, lineHeight: 15, fontWeight: "900", letterSpacing: 0.8, paddingHorizontal: spacing.md, paddingVertical: 5, textTransform: "uppercase" },
  chartBlock: { gap: spacing.sm },
  imageBlock: { gap: spacing.sm },
  valueLabel: { color: colors.cocoa, fontSize: 12, lineHeight: 16, fontWeight: "900" },
  muted: { color: colors.cocoa },
  errorText: { color: colors.danger, fontWeight: "700" },
  gridTable: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden", backgroundColor: "#fff" },
  gridRow: { minHeight: 38, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },
  gridHeadCell: { width: 132, backgroundColor: "#354f82", borderRightWidth: 1, borderRightColor: colors.border, color: "#fff", fontSize: 12, lineHeight: 16, fontWeight: "900", textAlign: "center", textAlignVertical: "center", padding: spacing.sm },
  gridCell: { width: 132, borderRightWidth: 1, borderRightColor: colors.border, color: colors.ink, fontSize: 12, lineHeight: 18, fontWeight: "700", padding: spacing.sm },
  imageNameCell: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  inlineIcon: { width: 24, height: 24 },
  gridCellText: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  reportImage: { width: "100%", height: 320, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  compactImage: { height: 170 }
});
