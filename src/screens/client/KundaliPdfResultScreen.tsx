import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguageSelector } from "@/components/LanguageSelector";
import { EmptyState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { generateKundaliReport, KundaliBasicAstroDetails, KundaliPlanet, KundaliReportResponse } from "@/services/kundali.service";
import { useKundaliStore } from "@/store/kundali.store";

const tabs = ["Basic", "Horoscope Charts", "Dasha", "KP", "Bhinnashtakvarga", "Yogas", "Dosha"] as const;
type KundaliTab = typeof tabs[number];

const reportKeys: Record<Exclude<KundaliTab, "Basic">, keyof NonNullable<ReturnType<typeof useKundaliStore.getState>["result"]>> = {
  "Horoscope Charts": "horoscopeCharts",
  Dasha: "dasha",
  KP: "kp",
  Bhinnashtakvarga: "bhinnashtakvarga",
  Yogas: "yogas",
  Dosha: "dosha"
};

export function KundaliPdfResultScreen() {
  const { language, t } = useTranslation();
  const result = useKundaliStore((state) => state.result);
  const request = useKundaliStore((state) => state.request);
  const setResult = useKundaliStore((state) => state.setResult);
  const [activeTab, setActiveTab] = useState<KundaliTab>("Basic");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  const basic = result?.basic;
  const details = basic?.basicAstroDetails;
  const planets = basic?.planetaryPositions?.planets || [];

  useEffect(() => {
    if (!request || request.language === language) return;

    let mounted = true;
    const nextRequest = { ...request, language };

    Promise.resolve()
      .then(() => {
        if (!mounted) return null;
        setRefreshing(true);
        setRefreshError("");
        return generateKundaliReport(nextRequest);
      })
      .then((response) => {
        if (mounted && response) setResult(response, nextRequest);
      })
      .catch((error) => {
        if (mounted) setRefreshError(getApiErrorMessage(error, "Unable to fetch Kundali details for selected language"));
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
          {t("Kundali")}
        </Text>
        <LanguageSelector />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text variant="headlineSmall" style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>
            {details?.full_name ? `${details.full_name}'s ${t("Kundali")}` : t("Kundali")}
          </Text>
          <Text style={styles.subtitle}>{formatBirthLine(details, request)}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((tab) => (
            <Pressable key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{t(tab)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {refreshing ? <Text style={styles.muted}>{t("Loading response for selected language")}</Text> : null}
        {refreshError ? <Text style={styles.errorText}>{t(refreshError)}</Text> : null}

        {!result ? (
          <EmptyState title="No Kundali result" description="Please create a Kundali first." />
        ) : activeTab === "Basic" ? (
          <>
            <InfoCard title="Basic Astro Details" rows={buildBasicAstroRows(details, request)} />
            <PlanetaryPositions planets={planets} />
          </>
        ) : (
          <KundaliReportTab title={activeTab} value={result[reportKeys[activeTab]]} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function KundaliReportTab({ title, value }: { title: KundaliTab; value?: KundaliReportResponse }) {
  const { t } = useTranslation();
  const reportValue = unwrapSingleSection(value);

  if (!value) return <EmptyState title={`No ${title} result`} description="Please create a Kundali first." />;
  if (title === "Dasha") return <DashaReport value={reportValue} />;

  const sections =
    title === "Yogas"
      ? buildYogaSections(reportValue)
      : title === "Bhinnashtakvarga"
        ? buildBhinnashtakvargaSections(reportValue)
        : title === "KP"
          ? buildKpSections(reportValue)
          : title === "Horoscope Charts"
            ? buildHoroscopeChartSections(reportValue)
            : buildReportSections(reportValue, title);

  return (
    <>
      {sections.map((section, index) => (
        <View key={`${section.title}-${index}`} style={styles.card}>
          <Text style={styles.cardTitle}>{t(formatKey(section.title))}</Text>
          {section.imageRows?.map((row, imageIndex) => (
            <View key={`${row.label}-${imageIndex}`} style={styles.imageBlock}>
              <Text style={styles.valueLabel}>{formatKey(row.label)}</Text>
              <RemoteImage value={row.image || ""} />
            </View>
          ))}
          {section.yogaRows ? <YogaTable rows={section.yogaRows} /> : null}
          {section.dataTable ? <DataTable columns={section.dataTable.columns} forceScroll={section.dataTable.forceScroll} rows={section.dataTable.rows} /> : null}
          {!section.yogaRows && !section.dataTable && section.rows.length ? <FlatReportTable rows={section.rows} /> : null}
        </View>
      ))}
    </>
  );
}

function InfoCard({ rows, title }: { rows: { label: string; value?: string | number }[]; title: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t(title)}</Text>
      {rows.map((row, index) => (
        <View key={`${row.label}-${index}`} style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t(row.label)}</Text>
          <Text style={styles.infoValue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.68}>{row.value ?? "-"}</Text>
        </View>
      ))}
    </View>
  );
}

function PlanetaryPositions({ planets }: { planets: KundaliPlanet[] }) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t("Planetary Positions")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.planetTable}>
          <PlanetRow cells={[t("Planet"), t("Sign"), t("Degree"), t("Nakshatra"), t("House"), t("Type")]} header />
          {planets.map((planet, index) => (
            <View key={`${planet.name || "planet"}-${index}`} style={styles.planetRow}>
              <View style={[styles.planetCell, styles.planetNameCell]}>
                {planet.image ? <Image source={{ uri: planet.image }} style={styles.planetIcon} /> : null}
                <Text style={styles.planetNameText} numberOfLines={1}>{planet.name_lan || planet.name || "-"}</Text>
              </View>
              <PlanetCell value={planet.sign} />
              <PlanetCell value={planet.longitude} />
              <PlanetCell value={planet.nakshatra} />
              <PlanetCell value={planet.house} />
              <PlanetCell value={planet.type || "-"} last />
            </View>
          ))}
          {!planets.length ? <PlanetRow cells={[t("No records found"), "", "", "", "", ""]} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}

function PlanetRow({ cells, header = false }: { cells: string[]; header?: boolean }) {
  return (
    <View style={styles.planetRow}>
      {cells.map((cell, index) => (
        <Text key={`${cell}-${index}`} style={[styles.planetCell, header && styles.planetHeadCell, index === 0 && styles.planetNameCell, index === cells.length - 1 && styles.lastCell]}>
          {cell}
        </Text>
      ))}
    </View>
  );
}

function PlanetCell({ last = false, value }: { last?: boolean; value?: string | number }) {
  return (
    <Text style={[styles.planetCell, last && styles.lastCell]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.62}>
      {value ?? "-"}
    </Text>
  );
}

function DashaReport({ value }: { value: unknown }) {
  const source = isRecord(value) && isRecord(value.dashas) ? value.dashas : value;
  if (!isRecord(source)) return <EmptyState title="No Dasha result" description="Please create a Kundali first." />;

  return (
    <>
      {isRecord(source.bhavBala) ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bhav Bala</Text>
          <View style={styles.bhavGrid}>
            {Object.entries(source.bhavBala)
              .filter(([, item]) => isRecord(item))
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([house, item]) => (
                <BhavBalaCard key={house} house={house} value={item as Record<string, unknown>} />
              ))}
          </View>
        </View>
      ) : null}

      {isRecord(source.mahaDasha) ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Maha Dasha</Text>
          <DataTable columns={["Dasha", "Start", "End"]} rows={mahaDashaTable(source.mahaDasha).rows} />
        </View>
      ) : null}

      {isRecord(source.antarDasha) ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Antar Dasha</Text>
          <View style={styles.dashaMiniGrid}>
            {mahaDashaEntries(source.antarDasha).map(([name, record]) => (
              <View key={name} style={styles.dashaMiniCard}>
                <Text style={styles.dashaCardTitle}>{formatKey(name)} Mahadasha</Text>
                <Text style={styles.dashaDate}>{formatDashaDateRange(record)}</Text>
                <Text style={styles.dashaKicker}>Antar Dasha</Text>
                <MiniDashaTable columns={["Dasha", "Start", "End"]} rows={flattenPeriodRows(record, false)} />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {isRecord(source.pratyantarDasha) ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pratyantar Dasha</Text>
          {mahaDashaEntries(source.pratyantarDasha).map(([name, record]) => (
            <View key={name} style={styles.dashaLargeCard}>
              <Text style={styles.dashaCardTitle}>{formatKey(name)} Mahadasha</Text>
              <Text style={styles.dashaDate}>{formatDashaDateRange(record)}</Text>
              <DataTable
                columns={["Antar Dasha", "Pratyantar Dasha", "Start", "End"]}
                forceScroll
                rows={flattenPeriodRows(record, true)}
              />
            </View>
          ))}
        </View>
      ) : null}

      {isRecord(source.yoginiDasha) ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Yogini Dasha</Text>
          <DataTable columns={["Dasha", "Start", "End", "Antar Dasha", "Antar End"]} forceScroll rows={yoginiDashaTable(source.yoginiDasha).rows} />
        </View>
      ) : null}

      {isRecord(source.shadbala) ? (
        Object.entries(source.shadbala).map(([key, item]) => (
          isRecord(item) ? (
            <View key={key} style={styles.card}>
              <Text style={styles.cardTitle}>{formatKey(key)}</Text>
              <DataTable columns={recordMapTable(item, "Planet").columns} forceScroll rows={recordMapTable(item, "Planet").rows} />
            </View>
          ) : null
        ))
      ) : null}
    </>
  );
}

function BhavBalaCard({ house, value }: { house: string; value: Record<string, unknown> }) {
  const rows: [string, unknown][] = [
    ["Bhavadhipati Bala", value.bhavadhipati_bala],
    ["Disha Bala", value.disha_bala],
    ["Drishti Bala", value.drishti_bala],
    ["House Lord", value.house_lord],
    ["House No", value.house_no || house],
    ["Rank", value.rank],
    ["Rupas", value.rupas],
    ["Sign Name", value.sign_name],
    ["Sign No", value.sign_no],
    ["Strength", value.strength],
    ["Total Pinda", value.total_pinda]
  ];

  return (
    <View style={styles.bhavCard}>
      <View style={styles.bhavHeader}>
        <Text style={styles.bhavTitle}>House {house}</Text>
        <Text style={styles.rankPill}>Rank {stringifyValue(value.rank) || "-"}</Text>
      </View>
      <View style={styles.bhavMetricGrid}>
        {rows.map(([label, item]) => (
          <View key={label} style={styles.bhavMetric}>
            <Text style={styles.bhavMetricLabel}>{label}</Text>
            <Text style={styles.bhavMetricValue}>{stringifyValue(item) || "-"}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function MiniDashaTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <View style={styles.miniDashaTable}>
      <View style={styles.dataRow}>
        {columns.map((column) => (
          <Text key={column} style={[styles.dataCell, styles.simpleDataCell, styles.dataHeadCell]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{formatKey(column)}</Text>
        ))}
      </View>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.dataRow}>
          {columns.map((column, columnIndex) => (
            <Text key={`${rowIndex}-${column}`} style={[styles.dataCell, styles.simpleDataCell]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{row[columnIndex] || "-"}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

type FlatReportRow = {
  label: string;
  value: string;
  image?: string;
};

type ReportSection = {
  title: string;
  rows: FlatReportRow[];
  imageRows?: FlatReportRow[];
  yogaRows?: YogaReportRow[];
  dataTable?: {
    columns: string[];
    rows: string[][];
    forceScroll?: boolean;
  };
};

function FlatReportTable({ rows }: { rows: FlatReportRow[] }) {
  const { width } = useWindowDimensions();
  if (!rows.length) return <Text style={styles.mutedInline}>No records found</Text>;

  const textRows = rows.filter((row) => !row.image);
  const imageRows = rows.filter((row) => row.image);
  const shouldScroll = textRows.some((row) => row.label.length > 22 || row.value.length > 80);
  const tableWidth = shouldScroll ? 720 : Math.max(280, width - spacing.lg * 4);

  return (
    <>
      {imageRows.map((row, index) => (
        <View key={`${row.label}-image-${index}`} style={styles.imageBlock}>
          <Text style={styles.valueLabel}>{formatKey(row.label)}</Text>
          <RemoteImage value={row.image || ""} />
        </View>
      ))}

      {textRows.length ? (
        <ScrollView horizontal={shouldScroll} showsHorizontalScrollIndicator={false}>
          <View style={[styles.table, { width: tableWidth }]}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableKeyCell, styles.tableHeadCell, styles.tableHeadText]}>{formatKey("Details")}</Text>
              <View style={[styles.tableValueCell, styles.tableHeadCell]}>
                <Text style={styles.tableHeadText}>{formatKey("Value")}</Text>
              </View>
            </View>
            {textRows.map((row, index) => (
              <View key={`${row.label}-${index}`} style={styles.tableRow}>
                <Text style={styles.tableKeyCell}>{formatKey(row.label)}</Text>
                <View style={styles.tableValueCell}>
                  <Text style={styles.tableText}>{row.value || "-"}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </>
  );
}

function YogaTable({ rows }: { rows: YogaReportRow[] }) {
  const { width } = useWindowDimensions();
  const shouldScroll = rows.some((row) => row.content.length > 90 || row.yogaName.length > 24);
  const tableWidth = shouldScroll ? 860 : Math.max(320, width - spacing.lg * 4);

  if (!rows.length) return <Text style={styles.mutedInline}>No records found</Text>;

  return (
    <ScrollView horizontal={shouldScroll} showsHorizontalScrollIndicator={false}>
      <View style={[styles.table, { width: tableWidth }]}>
        <View style={styles.tableRow}>
          <Text style={[styles.yogaNameCell, styles.tableHeadCell, styles.tableHeadText]}>{formatKey("Yoga Name")}</Text>
          <Text style={[styles.yogaValidCell, styles.tableHeadCell, styles.tableHeadText]}>{formatKey("Valid")}</Text>
          <View style={[styles.yogaContentCell, styles.tableHeadCell]}>
            <Text style={styles.tableHeadText}>{formatKey("Content")}</Text>
          </View>
        </View>
        {rows.map((row, index) => (
          <View key={`${row.yogaName}-${index}`} style={styles.tableRow}>
            <Text style={styles.yogaNameCell}>{row.yogaName}</Text>
            <View style={styles.yogaValidCell}>
              <MaterialCommunityIcons
                name={isTruthyText(row.valid) ? "check-circle" : "close-circle"}
                size={18}
                color={isTruthyText(row.valid) ? "#1c8f46" : colors.danger}
              />
            </View>
            <View style={styles.yogaContentCell}>
              <Text style={styles.tableText}>{row.content || "-"}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function DataTable({ columns, forceScroll = false, rows }: { columns: string[]; forceScroll?: boolean; rows: string[][] }) {
  const { width } = useWindowDimensions();
  const simpleDashaTable = isSimpleDashaColumns(columns);
  const shouldScroll = !simpleDashaTable && (forceScroll || columns.length > 4 || rows.some((row) => row.some((cell) => cell.length > 24)));
  const visibleWidth = Math.max(320, width - spacing.lg * 4);
  const columnWidths = simpleDashaTable
    ? []
    : shouldScroll
      ? columns.map((column, index) => getRequiredColumnWidth(column, rows.map((row) => row[index] || "")))
      : columns.map(() => Math.max(104, Math.floor(visibleWidth / Math.max(columns.length, 1))));
  const tableWidth = shouldScroll ? columnWidths.reduce((total, item) => total + item, 0) : visibleWidth;

  if (!rows.length) return <Text style={styles.mutedInline}>No records found</Text>;

  return (
    <ScrollView horizontal={shouldScroll} showsHorizontalScrollIndicator={false}>
      <View style={[styles.dataTable, { width: tableWidth }]}>
        <View style={styles.dataRow}>
          {columns.map((column, columnIndex) => (
            <Text key={`${column}-${columnIndex}`} style={[styles.dataCell, simpleDashaTable ? styles.simpleDataCell : { width: columnWidths[columnIndex] }, styles.dataHeadCell]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{formatKey(column)}</Text>
          ))}
        </View>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.dataRow}>
            {columns.map((column, columnIndex) => (
              <Text key={`${rowIndex}-${column}`} style={[styles.dataCell, simpleDashaTable ? styles.simpleDataCell : { width: columnWidths[columnIndex] }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{row[columnIndex] || "-"}</Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

type YogaReportRow = {
  yogaName: string;
  valid: string;
  content: string;
};

function buildReportSections(value: unknown, fallbackTitle: string): ReportSection[] {
  if (!isRecord(value)) {
    return [{ title: fallbackTitle, rows: flattenReportRows(value) }];
  }

  const entries = Object.entries(value).filter(([, item]) => item !== null && item !== undefined && item !== "");
  if (!entries.length) return [{ title: fallbackTitle, rows: [] }];

  if (entries.every(([, item]) => !isSectionLike(item))) {
    return [{ title: fallbackTitle, rows: flattenReportRows(value) }];
  }

  if (isHouseMap(value)) {
    return entries.map(([key, item]) => ({
      title: `House ${key}`,
      rows: flattenReportRows(item)
    }));
  }

  return entries.flatMap(([key, item]) => {
    if (key === "svg") return [];
    if (key === "base64_image") return [{ title: fallbackTitle, rows: flattenReportRows(item, "Chart") }];
    if (isHouseMap(item)) {
      return Object.entries(item).map(([houseKey, houseValue]) => ({
        title: `${formatKey(key)} House ${houseKey}`,
        rows: flattenReportRows(houseValue)
      }));
    }
    return [{ title: key, rows: flattenReportRows(item) }];
  });
}

function buildYogaSections(value: unknown): ReportSection[] {
  return [{ title: "Yogas", rows: [], yogaRows: collectYogaRows(value) }];
}

function buildBhinnashtakvargaSections(value: unknown): ReportSection[] {
  const source = isRecord(value) && isRecord(value.ashtakvarga) ? value.ashtakvarga : value;
  const sections: ReportSection[] = [];

  if (isRecord(source) && isRecord(source.table)) {
    sections.push(...buildAshtakvargaPlanetTables(source.table, "Bhinnashtakvarga"));
  }

  if (isRecord(source) && isRecord(source.d40Chart) && isRecord(source.d40Chart.table)) {
    sections.push(...buildAshtakvargaPlanetTables(source.d40Chart.table, "D40"));
  }

  if (isRecord(source) && isRecord(source.chart)) {
    Object.entries(source.chart).forEach(([key, item]) => {
      const image = getImageFromRecord(item);
      if (image) sections.push({ title: `${formatKey(key)} Chart`, rows: [], imageRows: [{ label: `${key} Chart`, value: "", image }] });
    });
  }

  if (isRecord(source) && isRecord(source.d40Chart) && isRecord(source.d40Chart.chart)) {
    const image = getImageFromRecord(source.d40Chart.chart);
    if (image) sections.push({ title: "D40 Chart", rows: [], imageRows: [{ label: "D40 Chart", value: "", image }] });
  }

  return sections.length ? sections : buildReportSections(source, "Bhinnashtakvarga");
}

function buildAshtakvargaPlanetTables(value: Record<string, unknown>, prefix: string): ReportSection[] {
  const columns = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "POINTS", "PLANT NAME"];

  return Object.entries(value)
    .filter(([, item]) => isRecord(item))
    .map(([planetName, rowsValue]) => {
      const rows = Object.entries(rowsValue as Record<string, unknown>)
        .filter(([, item]) => isRecord(item))
        .map(([plantName, item]) => {
          const record = item as Record<string, unknown>;
          return [
            ...columns.slice(0, 12).map((column) => stringifyValue(record[column]) || "-"),
            stringifyValue(record.points ?? record.total) || "-",
            formatKey(plantName)
          ];
        });

      return {
        title: `${prefix} ${planetName}`,
        rows: [],
        dataTable: { columns, rows }
      };
    });
}

function buildKpSections(value: unknown): ReportSection[] {
  const source = isRecord(value) && isRecord(value.kp) ? value.kp : value;
  if (!isRecord(source)) return buildReportSections(source, "KP");

  const sections: ReportSection[] = [];

  Object.entries(source).forEach(([key, item]) => {
    if (!isRecord(item)) {
      sections.push({ title: key, rows: flattenReportRows(item) });
      return;
    }

    const images = getImageFromRecord(item);
    const imageRows = images ? [{ label: `${key} Chart`, value: "", image: images }] : undefined;
    const tableSource =
      Array.isArray(item.planets) ? item.planets :
      Array.isArray(item.table_data) ? item.table_data :
      isRecord(item.table_data) ? Object.values(item.table_data) :
      isRecord(item.significator_table) ? significatorRows(item.significator_table) :
      isRecord(item.column) ? Object.values(item.column) :
      null;

    if (Array.isArray(tableSource) && tableSource.length) {
      sections.push({
        title: key,
        rows: [],
        imageRows,
        dataTable: recordsToDataTable(tableSource)
      });
      return;
    }

    sections.push({
      title: key,
      rows: flattenReportRows(item).filter((row) => !row.image),
      imageRows
    });
  });

  return sections;
}

function buildHoroscopeChartSections(value: unknown): ReportSection[] {
  const source = isRecord(value) && isRecord(value.horoscopeCharts) ? value.horoscopeCharts : value;
  if (!isRecord(source)) return buildReportSections(source, "Horoscope Charts");

  return Object.entries(source)
    .sort(([a], [b]) => getChartNumber(a) - getChartNumber(b))
    .map(([key, item]) => {
      const chartNumber = getChartNumber(key);
      const title = chartNumber ? `D${chartNumber} Chart` : formatKey(key).replace(/\bchart$/i, "Chart");
      const image = getImageFromRecord(item);
      const details = isRecord(item) && isRecord(item.data) ? chartDataRows(item.data) : [];
      return {
        title,
        rows: [],
        imageRows: image ? [{ label: title, value: "", image }] : undefined,
        dataTable: details.length
          ? { columns: ["House", "Sign No.", "Planets"], rows: details, forceScroll: true }
          : image ? undefined : recordsToDataTable([item])
      };
    });
}

function collectYogaRows(value: unknown): YogaReportRow[] {
  if (Array.isArray(value)) return value.flatMap((item) => collectYogaRows(item));
  if (!isRecord(value)) return [];

  return Object.entries(value).flatMap(([key, item]) => {
    if (!isRecord(item)) return [];

    if ("name" in item || "is_valid" in item || "content" in item) {
      return [{
        yogaName: stringifyValue(item.name) || formatKey(key),
        valid: stringifyValue(item.is_valid) || "-",
        content: stringifyContent(item.content)
      }];
    }

    return collectYogaRows(item);
  });
}

function isSectionLike(value: unknown) {
  if (Array.isArray(value)) return value.some((item) => isRecord(item) || Array.isArray(item));
  return isRecord(value);
}

function isHouseMap(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 1 && keys.every((key) => /^(?:[1-9]|1[0-2])$/.test(key));
}

function getImageFromRecord(value: unknown) {
  if (!isRecord(value)) return "";
  if (typeof value.base64_image === "string") return value.base64_image;
  if (typeof value.svg === "string") return value.svg;
  return "";
}

function chartDataRows(value: Record<string, unknown>) {
  return Object.entries(value)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([house, item]) => {
      const record = isRecord(item) ? item : {};
      const planets = Array.isArray(record.planet)
        ? record.planet.map((planet) => isRecord(planet) ? stringifyValue(planet.name || planet.symbol) : stringifyValue(planet)).filter(Boolean).join(", ")
        : "-";
      return [house, stringifyValue(record.sign_no) || "-", planets || "-"];
    });
}

function recordsToDataTable(values: unknown[]) {
  const records = values.filter(isRecord);
  const columns = Array.from(new Set(records.flatMap((record) => Object.keys(record).filter((key) => key !== "svg" && key !== "base64_image" && key !== "data"))));
  const rows = records.map((record) => columns.map((column) => stringifyTableCell(record[column])));
  return { columns, rows };
}

function recordMapTable(value: Record<string, unknown>, label = "Name") {
  const childRecords = Object.values(value).filter(isRecord);
  if (!childRecords.length) {
    return {
      columns: [label, "Value"],
      rows: Object.entries(value).map(([key, item]) => [formatKey(key), stringifyTableCell(item)])
    };
  }

  const columns = [label, ...Array.from(new Set(childRecords.flatMap((record) => Object.keys(record))))];
  const rows = Object.entries(value)
    .filter(([, item]) => isRecord(item))
    .map(([key, item]) => [formatKey(key), ...columns.slice(1).map((column) => stringifyTableCell((item as Record<string, unknown>)[column]))]);

  return { columns, rows };
}

function mahaDashaTable(value: Record<string, unknown>) {
  const maha = isRecord(value.maha_dasha) ? value.maha_dasha : value;
  return {
    columns: ["Maha Dasha", "Start", "End"],
    rows: Object.entries(maha)
      .filter(([, item]) => isRecord(item))
      .map(([name, item]) => {
        const record = item as Record<string, unknown>;
        return [formatKey(name), stringifyValue(record.start_date || record.start_time) || "--", stringifyValue(record.end_date || record.end_time) || "--"];
      })
  };
}

function mahaDashaEntries(value: Record<string, unknown>): [string, Record<string, unknown>][] {
  const maha = isRecord(value.maha_dasha) ? value.maha_dasha : value;
  return Object.entries(maha).filter(([, item]) => isRecord(item)) as [string, Record<string, unknown>][];
}

function formatDashaDateRange(record: Record<string, unknown>) {
  return [record.start_date, record.end_date].map(stringifyValue).filter(Boolean).join(" to ");
}

function flattenPeriodRows(record: Record<string, unknown>, includePratyantar: boolean) {
  const antar = isRecord(record.antar_dasha) ? record.antar_dasha : {};
  const rows: string[][] = [];

  Object.entries(antar).forEach(([antarName, antarValue]) => {
    if (!isRecord(antarValue)) return;
    if (includePratyantar && isRecord(antarValue.pratyantar_dasha)) {
      Object.entries(antarValue.pratyantar_dasha).forEach(([pratyantarName, pratyantarValue]) => {
        const pratyantar = isRecord(pratyantarValue) ? pratyantarValue : {};
        rows.push([
          formatKey(antarName),
          formatKey(pratyantarName),
          stringifyValue(pratyantar.start_time || pratyantar.start_date) || "--",
          stringifyValue(pratyantar.end_time || pratyantar.end_date) || "--"
        ]);
      });
      return;
    }

    rows.push([
      formatKey(antarName),
      stringifyValue(antarValue.start_time || antarValue.start_date) || "--",
      stringifyValue(antarValue.end_time || antarValue.end_date) || "--"
    ]);
  });

  return rows;
}

function yoginiDashaTable(value: Record<string, unknown>) {
  const items = Array.isArray(value.maha_dasha) ? value.maha_dasha : [];
  const rows = items.filter(isRecord).flatMap((item) => {
    const base = [stringifyValue(item.dasha), stringifyValue(item.start_date), stringifyValue(item.end_date)];
    if (!isRecord(item.antar_dasha)) return [base];
    return Object.entries(item.antar_dasha).map(([antarName, end]) => [...base, formatKey(antarName), stringifyValue(end)]);
  });

  return { columns: ["Dasha", "Start", "End", "Antar Dasha", "Antar End"], rows };
}

function significatorRows(value: Record<string, unknown>) {
  return Object.entries(value).map(([planet, item]) => ({ planet, ...(isRecord(item) ? item : {}) }));
}

function stringifyTableCell(value: unknown): string {
  if (isRecord(value) && isRecord(value.house_cusp)) {
    return [value.house_cusp.sign, value.house_cusp.degree].map(stringifyValue).filter(Boolean).join(" ");
  }
  return stringifyContent(value);
}

function isTruthyText(value: string) {
  return /^(true|yes|valid|1)$/i.test(value.trim());
}

function isSimpleDashaColumns(columns: string[]) {
  const normalized = columns.map((column) => column.toLowerCase().replace(/\s+/g, ""));
  return (
    normalized.length === 3 &&
    /^(maha)?dasha$/.test(normalized[0]) &&
    /^start(date)?$/.test(normalized[1]) &&
    /^end(date)?$/.test(normalized[2])
  );
}

function getRequiredColumnWidth(column: string, values: string[]) {
  const header = formatKey(column);
  const longest = [header, ...values].reduce((max, item) => Math.max(max, String(item || "").length), 0);
  const key = column.toLowerCase().replace(/\s+/g, "");

  if (/^(start|end|startdate|enddate|date)$/.test(key)) return 112;
  if (/^(house|sign|signno|points|rank|valid|cusp|name)$/.test(key)) return 78;
  if (/dasha|planet|lord|nakshatra|plantname/.test(key)) return Math.min(144, Math.max(104, longest * 7 + 24));
  if (longest <= 8) return 72;
  if (longest <= 16) return 104;
  if (longest <= 28) return 136;
  return 184;
}

function stringifyContent(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(stringifyContent).filter((item) => item && item !== "-").join(", ");
  if (!isRecord(value)) return String(value);

  return Object.entries(value)
    .map(([key, item]) => {
      const content = stringifyContent(item);
      return content && content !== "-" ? `${formatKey(key)}: ${content}` : "";
    })
    .filter(Boolean)
    .join(" | ");
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return stringifyContent(value);
}

function flattenReportRows(value: unknown, prefix = ""): FlatReportRow[] {
  if (value === null || value === undefined || value === "") return [];

  if (typeof value === "string") {
    return isImageValue(value, prefix)
      ? [{ label: prefix || "Chart", value: "", image: value }]
      : [{ label: prefix || "Value", value }];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [{ label: prefix || "Value", value: String(value) }];
  }

  if (Array.isArray(value)) {
    if (!value.length) return [];
    if (value.every((item) => !isRecord(item) && !Array.isArray(item))) {
      return [{ label: prefix || "Value", value: value.map(String).join(", ") }];
    }
    return value.flatMap((item, index) => flattenReportRows(item, joinLabel(prefix, String(index + 1))));
  }

  if (!isRecord(value)) return [{ label: prefix || "Value", value: String(value) }];

  const hasBase64Image = typeof value.base64_image === "string";
  return Object.entries(value).flatMap(([key, item]) => {
    if (item === null || item === undefined || item === "") return [];
    if (key === "svg" && hasBase64Image) return [];
    if (key === "base64_image") return flattenReportRows(item, joinLabel(prefix, "Chart"));
    return flattenReportRows(item, joinLabel(prefix, key));
  });
}
function RemoteImage({ value }: { value: string }) {
  const uri = normalizeImageUri(value);
  return <Image source={{ uri }} style={styles.reportImage} contentFit="contain" />;
}

function unwrapSingleSection(value: unknown) {
  if (!isRecord(value)) return value;
  const keys = Object.keys(value);
  if (keys.length === 1 && isRecord(value[keys[0]])) return value[keys[0]];
  return value;
}

function isImageValue(value: string, label?: string) {
  const clean = value.trim();
  const labelText = String(label || "").toLowerCase();
  return (
    clean.startsWith("<svg") ||
    clean.startsWith("data:image/") ||
    /\.(svg|png|jpe?g|webp)(\?|#|$)/i.test(clean) ||
    (/^https?:\/\//i.test(clean) && /(svg|chart|image|img|kundali|horoscope)/i.test(labelText))
  );
}

function normalizeImageUri(value: string) {
  const clean = value.trim();
  if (clean.startsWith("<svg")) return toSvgDataUri(clean);
  return clean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function joinLabel(prefix: string, key: string) {
  return prefix ? `${prefix} ${key}` : key;
}

function getChartNumber(value: string) {
  const match = value.match(/d[\s_-]*(\d+)/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
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
  if (/^d[\s_-]*\d+/i.test(clean)) return clean.replace(/[\s_-]+/g, "").replace(/chart$/i, " Chart").toUpperCase();

  return clean
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildBasicAstroRows(details?: KundaliBasicAstroDetails, request?: ReturnType<typeof useKundaliStore.getState>["request"]) {
  return [
    { label: "Name", value: details?.full_name || request?.fullName },
    { label: "Date of Birth", value: formatDate(details, request) },
    { label: "Time of Birth", value: formatTime(details, request) },
    { label: "Gender", value: details?.gender || request?.gender },
    { label: "Place of Birth", value: details?.place || request?.place },
    { label: "Latitude", value: details?.latitude || request?.latitude },
    { label: "Longitude", value: details?.longitude || request?.longitude },
    { label: "Timezone", value: details?.timezone ? `GMT +${details.timezone}` : request?.timeZone },
    { label: "Sunrise", value: details?.sunrise },
    { label: "Sunset", value: details?.sunset },
    { label: "Tithi", value: details?.tithi },
    { label: "Paksha", value: details?.paksha },
    { label: "Paya", value: [details?.paya?.type, details?.paya?.result].filter(Boolean).join(" - ") || undefined },
    { label: "Sunsign", value: details?.sunsign },
    { label: "Moonsign", value: details?.moonsign },
    { label: "Rashi Akshar", value: details?.rashi_akshar },
    { label: "Chandramasa", value: details?.chandramasa },
    { label: "Tatva", value: details?.tatva },
    { label: "Prahar", value: details?.prahar },
    { label: "Nakshatra", value: details?.nakshatra },
    { label: "Vaar", value: details?.vaar },
    { label: "Varna", value: details?.varna },
    { label: "Vashya", value: details?.vashya },
    { label: "Yoni", value: details?.yoni },
    { label: "Gana", value: details?.gana },
    { label: "Nadi", value: details?.nadi },
    { label: "Yoga", value: details?.yoga },
    { label: "Karana", value: details?.karana },
    { label: "Ayanamsha", value: details?.ayanamsha },
    { label: "Yunja", value: details?.yunja }
  ];
}

function formatBirthLine(details?: KundaliBasicAstroDetails, request?: ReturnType<typeof useKundaliStore.getState>["request"]) {
  return [formatDate(details, request), formatTime(details, request), details?.place || request?.place].filter(Boolean).join(" · ") || "-";
}

function formatDate(details?: KundaliBasicAstroDetails, request?: ReturnType<typeof useKundaliStore.getState>["request"]) {
  const day = details?.day || request?.day;
  const month = details?.month || request?.month;
  const year = details?.year || request?.year;
  return [day, month, year].filter(Boolean).join("-");
}

function formatTime(details?: KundaliBasicAstroDetails, request?: ReturnType<typeof useKundaliStore.getState>["request"]) {
  const hour = details?.hour || request?.hour;
  const minute = details?.minute || request?.min;
  return [hour, minute].filter(Boolean).join(":");
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fbfbef" },
  header: { minHeight: 58, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  headerAction: { width: 86, marginLeft: -8 },
  headerTitle: { flex: 1, color: colors.ink, fontWeight: "800", textAlign: "center" },
  content: { paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.xs },
  title: { color: colors.amber, fontWeight: "900", lineHeight: 31, textAlign: "center" },
  subtitle: { color: colors.cocoa, fontSize: 12, lineHeight: 17, textAlign: "center" },
  tabs: { minHeight: 58, paddingHorizontal: spacing.lg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, alignItems: "center", gap: spacing.md },
  tab: { minWidth: 140, minHeight: 38, borderRadius: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  tabActive: { borderWidth: 1, borderColor: colors.lime, backgroundColor: "#ffffb8" },
  tabText: { color: colors.cocoa, fontWeight: "800" },
  tabTextActive: { color: colors.ink },
  card: { marginHorizontal: spacing.lg, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.sm },
  cardTitle: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: "900", marginBottom: spacing.xs },
  imageBlock: { gap: spacing.sm },
  valueLabel: { color: colors.cocoa, fontSize: 12, lineHeight: 16, fontWeight: "900" },
  infoRow: { minHeight: 34, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoLabel: { flex: 1, color: colors.cocoa, fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  infoValue: { flex: 1.2, color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: "800", textAlign: "right" },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden", backgroundColor: "#fff" },
  tableRow: { minHeight: 38, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },
  tableKeyCell: { flex: 0.8, backgroundColor: "#ffffd3", borderRightWidth: 1, borderRightColor: colors.border, color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "900", textAlignVertical: "center", padding: spacing.sm },
  tableValueCell: { flex: 1.4, minWidth: 0, justifyContent: "center", padding: spacing.sm },
  tableText: { color: colors.ink, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  tableHeadCell: { backgroundColor: "#354f82", borderRightWidth: 1, borderRightColor: colors.border },
  tableHeadText: { color: "#fff", fontSize: 12, lineHeight: 16, fontWeight: "900", textAlignVertical: "center" },
  yogaNameCell: { flex: 0.9, borderRightWidth: 1, borderRightColor: colors.border, color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "900", textAlignVertical: "center", padding: spacing.sm },
  yogaValidCell: { flex: 0.45, borderRightWidth: 1, borderRightColor: colors.border, color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "800", textAlign: "center", textAlignVertical: "center", padding: spacing.sm },
  yogaContentCell: { flex: 1.65, minWidth: 0, justifyContent: "center", padding: spacing.sm },
  dataTable: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden", backgroundColor: "#fff" },
  dataRow: { minHeight: 38, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },
  dataCell: { width: 112, borderRightWidth: 1, borderRightColor: colors.border, color: colors.ink, fontSize: 11, lineHeight: 16, fontWeight: "700", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 6, paddingVertical: 6 },
  simpleDataCell: { flex: 1, width: undefined },
  dataHeadCell: { backgroundColor: "#354f82", color: "#fff", fontWeight: "900" },
  bhavGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  bhavCard: { flex: 1, minWidth: 290, borderRadius: 8, borderWidth: 1, borderColor: "#eadf8b", backgroundColor: "#fffef8", padding: spacing.md, gap: spacing.md },
  bhavHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  bhavTitle: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "900" },
  rankPill: { minWidth: 64, borderRadius: 16, backgroundColor: "#ffffb8", color: "#9a7a00", fontSize: 12, lineHeight: 18, fontWeight: "900", textAlign: "center", paddingHorizontal: spacing.sm, paddingVertical: 3 },
  bhavMetricGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  bhavMetric: { width: "31%", minWidth: 96, minHeight: 74, borderRadius: 8, borderWidth: 1, borderColor: "#eadf8b", backgroundColor: "#fff", padding: spacing.sm, justifyContent: "center", gap: 5 },
  bhavMetricLabel: { color: "#8a6b00", fontSize: 10, lineHeight: 13, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  bhavMetricValue: { color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: "900" },
  dashaMiniGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  dashaMiniCard: { flex: 1, minWidth: 310, borderRadius: 8, borderWidth: 1, borderColor: "#eadf8b", backgroundColor: "#fffef8", padding: spacing.md, gap: spacing.sm },
  dashaLargeCard: { borderRadius: 8, borderWidth: 1, borderColor: "#eadf8b", backgroundColor: "#fffef8", padding: spacing.md, gap: spacing.sm, marginTop: spacing.md },
  dashaCardTitle: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "900" },
  dashaDate: { color: colors.cocoa, fontSize: 12, lineHeight: 16, fontWeight: "800" },
  dashaKicker: { color: "#8a6b00", fontSize: 10, lineHeight: 13, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  miniDashaTable: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden", backgroundColor: "#fff" },
  planetTable: { width: 720, borderTopWidth: 1, borderLeftWidth: 1, borderColor: colors.border },
  planetRow: { minHeight: 40, flexDirection: "row" },
  planetCell: { width: 108, borderRightWidth: 1, borderBottomWidth: 1, borderColor: colors.border, color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "700", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 6, paddingVertical: 6 },
  planetHeadCell: { backgroundColor: "#354f82", color: "#fff", fontWeight: "900" },
  planetNameCell: { width: 150, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  planetIcon: { width: 22, height: 22, borderRadius: 11 },
  planetNameText: { color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "800" },
  lastCell: { borderRightWidth: 0 },
  reportImage: { width: "100%", height: 320, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  muted: { marginHorizontal: spacing.lg, color: colors.cocoa },
  mutedInline: { color: colors.cocoa },
  errorText: { marginHorizontal: spacing.lg, color: colors.danger, fontWeight: "700" }
});
