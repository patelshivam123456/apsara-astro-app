import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";

import { spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";

export type NumerologyExportRow = (string | number | undefined | null)[];

export type NumerologyExportSection = {
  title: string;
  rows: NumerologyExportRow[];
  layout?: "normal" | "wide";
  variant?: "normal" | "intro" | "loShuGrid" | "summary" | "detailButton" | "effects" | "reading" | "details" | "count" | "splitPanel" | "soul" | "repetitionEffects";
};

type NumerologyExportButtonProps = {
  fileName: string;
  title: string;
  sections: NumerologyExportSection[] | (() => Promise<NumerologyExportSection[]>);
};

export function NumerologyExportButton({ fileName, sections, title }: NumerologyExportButtonProps) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const exportReport = async () => {
    try {
      setExporting(true);
      const resolvedSections = typeof sections === "function" ? await sections() : sections;
      const html = buildPdfHtml(title, resolvedSections);
      const safeBaseName = fileName.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "numerology-report";
      const hasWideSection = resolvedSections.some((section) => section.layout === "wide");

      if (Platform.OS === "web") {
        await Print.printAsync({ html });
        return;
      }

      const pdf = await Print.printToFileAsync({
        html,
        base64: Platform.OS === "android",
        width: hasWideSection ? 792 : 612,
        height: hasWideSection ? 612 : 792,
        margins: { top: 24, right: 24, bottom: 24, left: 24 }
      });

      if (Platform.OS === "android" && pdf.base64) {
        const initialUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot("Download");
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);

        if (permissions.granted) {
          const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            safeBaseName,
            "application/pdf"
          );
          await FileSystem.StorageAccessFramework.writeAsStringAsync(destinationUri, pdf.base64, {
            encoding: FileSystem.EncodingType.Base64
          });
          Alert.alert(t("Download PDF"), t("PDF downloaded successfully."));
          return;
        }
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdf.uri, {
          dialogTitle: t("Download PDF"),
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf"
        });
      } else {
        Alert.alert(t("Download PDF"), t("PDF generated successfully."));
      }
    } catch {
      Alert.alert(t("Download PDF"), t("Unable to download PDF file."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Pressable style={[styles.button, exporting && styles.buttonDisabled]} onPress={exportReport} disabled={exporting}>
      <MaterialCommunityIcons name="file-pdf-box" size={21} color="#145c24" />
      <Text style={styles.buttonText}>{exporting ? t("Downloading") : t("Download PDF")}</Text>
    </Pressable>
  );
}

function buildPdfHtml(title: string, sections: NumerologyExportSection[]) {
  const hasWideSection = sections.some((section) => section.layout === "wide");
  const body = sections.map(renderSection).join("");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page { margin: 24px; ${hasWideSection ? "size: landscape;" : ""} }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #ffffc9;
          color: #111;
          font-family: Arial, sans-serif;
        }
        .page {
          width: 100%;
          min-height: 100%;
          background: #ffffc9;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        h1 {
          margin: 0;
          border-radius: 8px;
          background: #bff2c6;
          color: #145c24;
          font-size: 24px;
          line-height: 32px;
          font-weight: 900;
          padding: 12px 16px;
        }
        .card {
          border-radius: 8px;
          background: #fff;
          padding: 12px;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.16);
          break-inside: auto;
          page-break-inside: auto;
        }
        .card table {
          page-break-inside: auto;
        }
        tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        h2 {
          margin: 0 0 10px;
          border-radius: 6px;
          background: #bff2c6;
          color: #145c24;
          font-size: 18px;
          line-height: 24px;
          font-weight: 900;
          padding: 8px 10px;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          background: #fff;
        }
        th, td {
          border: 1px solid #111;
          padding: 7px;
          text-align: center;
          vertical-align: middle;
          font-size: 12px;
          line-height: 16px;
        }
        th {
          background: #ffcf28;
          color: #111;
          font-weight: 900;
        }
        td {
          font-weight: 700;
        }
        .intro-card {
          background: #f8fff6;
          border: 0;
        }
        .intro-title {
          border-radius: 6px;
          background: #bff2c6;
          color: #145c24;
          font-size: 18px;
          line-height: 26px;
          font-weight: 900;
          padding: 8px 12px;
        }
        .intro-text {
          color: #243727;
          font-size: 15px;
          line-height: 24px;
          font-weight: 800;
          margin-top: 10px;
        }
        .loshu-grid {
          width: 204px;
          margin: 0 auto;
          border-radius: 10px;
          background: #fff;
          padding: 6px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
          box-shadow: 0 5px 8px rgba(13, 52, 64, 0.22);
        }
        .loshu-cell {
          min-height: 46px;
          border-radius: 7px;
          background: #f8fff6;
          color: #111;
          font-size: 18px;
          line-height: 46px;
          font-weight: 900;
          text-align: center;
        }
        .summary-grid,
        .year-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .number-card {
          min-height: 82px;
          border-radius: 8px;
          border: 2px solid #68ad62;
          background: #fff;
          padding: 8px 6px;
          text-align: center;
        }
        .number-label {
          color: #777;
          font-size: 11px;
          line-height: 16px;
          font-weight: 900;
        }
        .number-value {
          color: #136a28;
          font-size: 24px;
          line-height: 30px;
          font-weight: 900;
        }
        .number-note {
          color: #777;
          font-size: 10px;
          line-height: 14px;
          font-weight: 800;
        }
        .detail-button {
          min-height: 64px;
          border-radius: 10px;
          border: 1.5px solid #32b248;
          background: #f8fff6;
          padding: 12px 14px;
          display: flex;
          justify-content: center;
        }
        .detail-button-title {
          color: #0b5719;
          font-size: 15px;
          line-height: 20px;
          font-weight: 900;
        }
        .detail-button-subtitle {
          color: #36543a;
          font-size: 12px;
          line-height: 16px;
          font-weight: 800;
          margin-top: 3px;
        }
        .effects-card {
          background: #fffde5;
        }
        .repetition-card {
          border: 1.5px solid #b5d7ff;
          background: #eaf5ff;
        }
        .repetition-hero {
          display: grid;
          grid-template-columns: 1fr 132px;
          gap: 14px;
          align-items: center;
        }
        .repetition-kicker {
          color: #1167df;
          font-size: 15px;
          line-height: 20px;
          font-weight: 900;
        }
        .repetition-title {
          color: #061b4f;
          font-size: 24px;
          line-height: 30px;
          font-weight: 900;
          margin-top: 3px;
        }
        .repetition-grid {
          width: 132px;
          height: 132px;
          border-radius: 8px;
          background: #fff;
          padding: 5px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3px;
          box-shadow: 0 4px 6px rgba(11, 58, 120, 0.2);
        }
        .repetition-cell {
          border: 1px solid #edf2ff;
          border-radius: 5px;
          background: #d8ecff;
          color: #061b4f;
          font-size: 16px;
          line-height: 29px;
          font-weight: 900;
          text-align: center;
          overflow: hidden;
        }
        .repetition-cell.missing {
          background: #f1f1f1;
          color: #777;
          font-size: 13px;
          line-height: 16px;
          padding-top: 4px;
        }
        .repetition-cell.many {
          color: #d71920;
        }
        .repetition-missing-label {
          display: block;
          font-size: 7px;
          line-height: 9px;
          font-weight: 900;
        }
        .repetition-effects {
          margin-top: 12px;
        }
        .repetition-effect {
          min-height: 72px;
          border-radius: 8px;
          background: #fff;
          padding: 10px 12px;
          margin-top: 8px;
          box-shadow: 0 2px 4px rgba(11, 58, 120, 0.12);
        }
        .repetition-effect-title {
          color: #061b4f;
          font-size: 17px;
          line-height: 22px;
          font-weight: 900;
        }
        .repetition-effect-text {
          color: #111;
          font-size: 13px;
          line-height: 20px;
          margin-top: 5px;
        }
        .repetition-note {
          color: #111;
          font-size: 12px;
          line-height: 18px;
          font-weight: 700;
          margin-top: 10px;
        }
        .effect-panel {
          min-height: 84px;
          border-radius: 8px;
          background: #fff;
          padding: 10px 12px;
          margin-top: 8px;
        }
        .effect-title {
          font-size: 20px;
          line-height: 26px;
          font-weight: 900;
        }
        .effect-text {
          color: #111;
          font-size: 13px;
          line-height: 20px;
          margin-top: 4px;
        }
        .reading-card {
          border: 2px solid #0d3440;
          background: #fffde5;
          box-shadow: none;
        }
        .reading-line,
        .detail-point {
          color: #111;
          font-family: serif;
          font-size: 14px;
          line-height: 21px;
          font-weight: 700;
        }
        .detail-summary {
          border-radius: 7px;
          border: 1px solid #39a853;
          background: #fff;
          padding: 10px 12px;
        }
        .detail-summary-number {
          color: #145c24;
          font-size: 18px;
          line-height: 28px;
          font-weight: 900;
        }
        .detail-summary-text {
          color: #111;
          font-size: 13px;
          line-height: 20px;
          font-weight: 700;
        }
        .detail-section {
          border: 1px solid #39d34a;
          border-radius: 7px;
          background: #fff;
          padding: 8px;
          margin-top: 10px;
        }
        .detail-heading {
          border: 1px solid #39d34a;
          border-radius: 5px;
          background: #c9f6c6;
          color: #075416;
          font-size: 16px;
          line-height: 22px;
          font-weight: 900;
          text-align: center;
          padding: 6px;
          margin-bottom: 6px;
        }
        .detail-point {
          margin: 2px 0;
        }
        .count-card {
          border-radius: 8px;
          background: #fff;
          padding: 0;
          overflow: hidden;
        }
        .count-title {
          color: #145c24;
          font-size: 14px;
          line-height: 18px;
          font-weight: 700;
          padding: 8px 12px;
          border-bottom: 1px solid #e1e1e1;
        }
        .count-row {
          display: grid;
          grid-template-columns: repeat(9, 1fr);
          min-height: 54px;
        }
        .count-item {
          text-align: center;
          padding: 7px 4px;
          border-right: 1px solid #e1e1e1;
        }
        .count-item:last-child {
          border-right: 0;
        }
        .count-number {
          color: #777;
          font-size: 13px;
          line-height: 15px;
          font-weight: 600;
        }
        .count-value {
          color: #136a28;
          font-size: 13px;
          line-height: 21px;
          font-weight: 600;
          margin-top: 2px;
        }
        .split-card,
        .soul-card {
          border-radius: 8px;
          background: #fff;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 4px 7px rgba(13, 52, 64, 0.18);
        }
        .split-row,
        .soul-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          min-height: 46px;
        }
        .split-cell,
        .soul-cell {
          text-align: center;
          padding: 9px 8px;
          border-right: 1px solid #d6d6d6;
          border-bottom: 1px solid #d6d6d6;
        }
        .split-cell:last-child,
        .soul-cell:last-child {
          border-right: 0;
        }
        .split-label,
        .soul-label {
          color: #000;
          font-size: 14px;
          line-height: 17px;
          font-weight: 700;
        }
        .split-value,
        .soul-value {
          color: #000;
          font-size: 13px;
          line-height: 17px;
          font-weight: 600;
          margin-top: 4px;
        }
        .wide-table {
          table-layout: fixed;
        }
        .wide-table th,
        .wide-table td {
          padding: 4px 3px;
          font-size: 9px;
          line-height: 12px;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
      </style>
    </head>
    <body>
      <main class="page">
        <h1>${escapeHtml(title)}</h1>
        ${body}
      </main>
    </body>
  </html>`;
}

function renderSection(section: NumerologyExportSection) {
  switch (section.variant) {
    case "intro":
      return renderIntroSection(section);
    case "loShuGrid":
      return renderLoShuGridSection(section);
    case "summary":
      return renderSummarySection(section);
    case "detailButton":
      return renderDetailButtonSection(section);
    case "effects":
      return renderEffectsSection(section);
    case "reading":
      return renderReadingSection(section);
    case "details":
      return renderDetailsSection(section);
    case "count":
      return renderCountSection(section);
    case "splitPanel":
      return renderSplitPanelSection(section);
    case "soul":
      return renderSoulSection(section);
    case "repetitionEffects":
      return renderRepetitionEffectsSection(section);
    default:
      return renderTableSection(section);
  }
}

function renderIntroSection(section: NumerologyExportSection) {
  return `
    <section class="card intro-card">
      <div class="intro-title">${escapeHtml(section.title)}</div>
      <div class="intro-text">${escapeHtml(formatCell(section.rows[0]?.[0]))}</div>
    </section>`;
}

function renderLoShuGridSection(section: NumerologyExportSection) {
  const cells = section.rows.flatMap((row) => row.slice(1));
  return `
    <section class="card">
      <h2>${escapeHtml(section.title)}</h2>
      <div class="loshu-grid">
        ${cells.map((cell) => `<div class="loshu-cell">${escapeHtml(formatCell(cell))}</div>`).join("")}
      </div>
    </section>`;
}

function renderSummarySection(section: NumerologyExportSection) {
  return `
    <section class="summary-grid">
      ${section.rows
        .map(
          ([label, value, note]) => `
            <div class="number-card">
              <div class="number-label">${escapeHtml(formatCell(label))}</div>
              <div class="number-value">${escapeHtml(formatCell(value))}</div>
              ${note ? `<div class="number-note">${escapeHtml(formatCell(note))}</div>` : ""}
            </div>`
        )
        .join("")}
    </section>`;
}

function renderDetailButtonSection(section: NumerologyExportSection) {
  return `
    <section class="detail-button">
      <div class="detail-button-title">${escapeHtml(formatCell(section.rows[0]?.[0]))}</div>
      <div class="detail-button-subtitle">${escapeHtml(formatCell(section.rows[1]?.[0]))}</div>
    </section>`;
}

function renderEffectsSection(section: NumerologyExportSection) {
  return `
    <section class="card effects-card">
      <h2>${escapeHtml(section.title)}</h2>
      ${section.rows
        .map(([label, value, color], index) => {
          if (index === 0) return `<div class="detail-summary-text">${escapeHtml(formatCell(label))}: ${escapeHtml(formatCell(value))}</div>`;
          return `
            <div class="effect-panel">
              <div class="effect-title" style="color: ${escapeHtml(formatCell(color))};">${escapeHtml(formatCell(label))}</div>
              <div class="effect-text">${escapeHtml(formatCell(value))}</div>
            </div>`;
        })
        .join("")}
    </section>`;
}

function renderReadingSection(section: NumerologyExportSection) {
  return `
    <section class="card reading-card">
      <h2>${escapeHtml(section.title)}</h2>
      ${section.rows.map(([value]) => `<div class="reading-line">- ${escapeHtml(formatCell(value))}</div>`).join("")}
    </section>`;
}

function renderDetailsSection(section: NumerologyExportSection) {
  const [summary, ...details] = section.rows;
  return `
    <section class="card">
      <h2>${escapeHtml(section.title)}</h2>
      <div class="detail-summary">
        <div class="detail-summary-number">${escapeHtml(formatCell(summary?.[0]))}</div>
        ${summary?.[1] ? `<div class="detail-summary-text">${escapeHtml(formatCell(summary[1]))}</div>` : ""}
        ${summary?.[2] ? `<div class="detail-summary-text">${escapeHtml(formatCell(summary[2]))}</div>` : ""}
      </div>
      ${details
        .map(
          ([heading, ...points]) => `
            <div class="detail-section">
              <div class="detail-heading">${escapeHtml(formatCell(heading))}</div>
              ${points.map((point) => `<div class="detail-point">• ${escapeHtml(formatCell(point))}</div>`).join("")}
            </div>`
        )
        .join("")}
    </section>`;
}

function renderRepetitionEffectsSection(section: NumerologyExportSection) {
  const [gridCells = [], ...effects] = section.rows;
  return `
    <section class="card repetition-card">
      <div class="repetition-hero">
        <div>
          <div class="repetition-kicker">${escapeHtml(formatCell(section.rows[0]?.[9]))}</div>
          <div class="repetition-title">${escapeHtml(section.title)}</div>
        </div>
        <div class="repetition-grid">
          ${gridCells
            .slice(0, 9)
            .map((cell) => {
              const text = formatCell(cell);
              const missing = text.includes("|missing");
              const many = text.includes("|many");
              const cleanText = text.replace("|missing", "").replace("|many", "");
              return `<div class="repetition-cell${missing ? " missing" : ""}${many ? " many" : ""}">${escapeHtml(cleanText)}${missing ? `<span class="repetition-missing-label">${escapeHtml(formatCell(section.rows[0]?.[10]))}</span>` : ""}</div>`;
            })
            .join("")}
        </div>
      </div>
      <div class="repetition-effects">
        ${effects
          .map(([title, meaning, note]) => {
            if (note === "note") return `<div class="repetition-note">${escapeHtml(formatCell(meaning))}</div>`;
            return `
              <div class="repetition-effect">
                <div class="repetition-effect-title">${escapeHtml(formatCell(title))}</div>
                <div class="repetition-effect-text">${escapeHtml(formatCell(meaning))}</div>
              </div>`;
          })
          .join("")}
      </div>
    </section>`;
}

function renderCountSection(section: NumerologyExportSection) {
  return `
    <section class="card count-card">
      <div class="count-title">${escapeHtml(section.title)}</div>
      <div class="count-row">
        ${section.rows
          .map(
            ([number, value]) => `
              <div class="count-item">
                <div class="count-number">${escapeHtml(formatCell(number))}</div>
                <div class="count-value">${escapeHtml(formatCell(value))}</div>
              </div>`
          )
          .join("")}
      </div>
    </section>`;
}

function renderSplitPanelSection(section: NumerologyExportSection) {
  return `
    <section class="split-card">
      <div class="split-row">
        ${section.rows
          .map(
            ([label, value]) => `
              <div class="split-cell">
                <div class="split-label">${escapeHtml(formatCell(label))}</div>
                <div class="split-value">${escapeHtml(formatCell(value))}</div>
              </div>`
          )
          .join("")}
      </div>
    </section>`;
}

function renderSoulSection(section: NumerologyExportSection) {
  return `
    <section class="soul-card">
      ${section.rows
        .map(
          ([label, value]) => `
            <div class="soul-row">
              <div class="soul-cell soul-label">${escapeHtml(formatCell(label))}</div>
              <div class="soul-cell soul-value">${escapeHtml(formatCell(value))}</div>
            </div>`
        )
        .join("")}
    </section>`;
}

function renderTableSection(section: NumerologyExportSection) {
  return `
    <section class="card">
      <h2>${escapeHtml(section.title)}</h2>
      <table class="${section.layout === "wide" ? "wide-table" : ""}">
        ${section.rows
          .map(
            (row, rowIndex) => `
              <tr>
                ${row
                  .map((cell) => {
                    const tag = rowIndex === 0 ? "th" : "td";
                    return `<${tag}>${escapeHtml(formatCell(cell))}</${tag}>`;
                  })
                  .join("")}
              </tr>`
          )
          .join("")}
      </table>
    </section>`;
}

function formatCell(value: string | number | undefined | null) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-end",
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#34a853",
    backgroundColor: "#f8fff6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    shadowColor: "#0d5a1d",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3
  },
  buttonDisabled: { opacity: 0.68 },
  buttonText: { color: "#145c24", fontSize: 14, lineHeight: 18, fontWeight: "900" }
});
