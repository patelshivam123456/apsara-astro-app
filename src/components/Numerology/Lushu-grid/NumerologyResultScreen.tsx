import { Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NumerologyCalculationTabs } from "@/components/Numerology/CalculationTabs";
import { NumerologyExportButton, NumerologyExportRow, NumerologyExportSection } from "@/components/Numerology/NumerologyExport";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { useTranslation } from "@/context/LanguageContext";
import {
  getPersonalityDestinyDetails,
  PersonalityDestinyDetailsResponse,
  PersonalityDestinyType
} from "@/services/numerology.service";
import { translateUniqueTexts } from "@/services/translation.service";

import { GridIntro, NumberCard, NumberSummaryGrid } from "./Common";
import { Calculation, defaultGridCells, months, personalYearNotes, sectorEffectTabs } from "./constants";
import { LoShuGrid } from "./LoShuGrid";
import { LoShuRepetitionEffectsSection } from "./LoShuRepetitionEffectsSection";
import { MatrixTable } from "./MatrixTable";
import { PersonalYearReading } from "./PersonalYearReading";
import { RelationTable } from "./RelationTable";
import { SectorWiseEffects } from "./SectorWiseEffects";
import { styles } from "./styles";
import { useNumerologyReport } from "./useNumerologyReport";
import {
  findRelationship,
  getMonthValue,
  getPersonalityDestinySections,
  getRelationStatus,
  localizeDigitsInText,
  translatePersonalityDestinyDetails
} from "./utils";

export function NumerologyResultScreen() {
  const { language, t } = useTranslation();
  const params = useLocalSearchParams<{
    fullName?: string;
    dob?: string;
    gender?: string;
    calculation?: Calculation;
    personBFullName?: string;
    personBDob?: string;
    personBGender?: string;
  }>();
  const fullName = String(params.fullName || "");
  const dob = String(params.dob || "");
  const gender = String(params.gender || "Male");
  const personBFullName = String(params.personBFullName || "");
  const personBDob = String(params.personBDob || "");
  const personBGender = String(params.personBGender || "Female");
  const {
    currentSectorEffects,
    error,
    fromYear,
    loading,
    loShu,
    matrix,
    matrixLoading,
    personalYear,
    refreshMatrix,
    relationships,
    repetitionEffects,
    sectorTranslating,
    setFromYear,
    setToYear,
    toYear
  } = useNumerologyReport({ dob, fullName, gender, language });

  const openPersonalityDestinyDetails = () => {
    router.push({
      pathname: "/astrologer/personality-destiny",
      params: {
        personalityNumber: String(loShu?.driverNumber || ""),
        destinyNumber: String(loShu?.destinyNumber || ""),
        tab: "PERSONALITY"
      }
    });
  };

  if (loading) return <LoadingState label="Loading numerology report" />;
  if (error && !loShu) return <ErrorState message={error} onRetry={() => router.replace("/astrologer/numerology")} />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
        <Text variant="headlineSmall" style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{t("Numerology")}</Text>
        <LanguageSelector />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.resultContent} stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        <NumerologyCalculationTabs
          active="lo-shu-grid"
          fullName={fullName}
          dob={dob}
          gender={gender}
          personBFullName={personBFullName}
          personBDob={personBDob}
          personBGender={personBGender}
        />
        <NumerologyExportButton
          title={`${t("Lo Shu Grid")} - ${fullName}`}
          fileName={`lo-shu-grid-${fullName}`}
          sections={() => buildLoShuExportSections({
            dob,
            fullName,
            gender,
            language,
            t,
            loShu,
            matrix,
            personalYear,
            relationships,
            repetitionEffects,
            sectorEffects: currentSectorEffects,
            sectorTranslating
          })}
        />
        <GridIntro
          title={t("Lo Shu Grid")}
          description={t("Birth-date numbers arranged to reveal strengths, missing energies, and life patterns.")}
        />
        <LoShuGrid grid={loShu?.grid} />
        <NumberSummaryGrid
          rows={[
            [
              { label: t("Personality Number"), value: loShu?.driverNumber, note: t("Inner Nature") },
              { label: t("Destiny Number"), value: loShu?.destinyNumber, note: t("Life Path") },
              { label: t("Kua Number"), value: loShu?.kuaNumber, note: t("Personal Energy") }
            ],
            [
              { label: t("Name Number"), value: loShu?.nameNumber, note: t("Compound") },
              { label: t("Running Age"), value: loShu?.runningAge, note: t("Years") },
              { label: t("Zodiac"), value: loShu?.zodiacNumber, note: loShu?.zodiacSign || t("Zodiac Sign") }
            ]
          ]}
        />
        <Pressable style={styles.detailButton} onPress={openPersonalityDestinyDetails}>
          <View style={styles.detailButtonCopy}>
            <Text style={styles.detailButtonTitle}>{t("Check Personality and Destiny Details")}</Text>
            <Text style={styles.detailButtonSubtitle}>{t("Personality")} {loShu?.driverNumber ?? "-"}  |  {t("Destiny")} {loShu?.destinyNumber ?? "-"}</Text>
          </View>
          <View style={styles.detailButtonArrow}>
            <MaterialCommunityIcons name="arrow-right" size={23} color="#fff" />
          </View>
        </Pressable>
        <LoShuRepetitionEffectsSection effects={repetitionEffects} />
        <RelationTable relationships={relationships} personalityNo={loShu?.driverNumber} destinyNo={loShu?.destinyNumber} />
        <View style={styles.yearCards}>
          <NumberCard label={t("Current Personal Year")} value={personalYear?.personalYear} />
          <NumberCard label={t("Current Personal Month")} value={personalYear?.personalMonth} />
          <NumberCard label={t("Current Personal Day")} value={personalYear?.personalDay} />
        </View>
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.68}>
            {t("Matrix for Personal Year & Month")}
          </Text>
          <View style={styles.yearInputsInHeading}>
            <TextInput value={fromYear} onChangeText={setFromYear} keyboardType="number-pad" placeholder={t("From Year")} style={styles.yearInputInHeading} />
            <TextInput value={toYear} onChangeText={setToYear} keyboardType="number-pad" placeholder={t("To Year")} style={styles.yearInputInHeading} />
            <Pressable style={styles.smallBtnInHeading} onPress={refreshMatrix} disabled={matrixLoading}>
              <Text style={styles.smallBtnText}>{matrixLoading ? t("Loading") : t("Apply")}</Text>
            </Pressable>
          </View>
        </View>
        {error ? <Text style={styles.validation}>{error}</Text> : null}
        <MatrixTable rows={matrix} />
        <SectorWiseEffects effects={currentSectorEffects} translating={sectorTranslating} />
        <PersonalYearReading value={personalYear?.personalYear} />
      </ScrollView>
      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}

async function buildLoShuExportSections({
  dob,
  fullName,
  gender,
  language,
  t,
  loShu,
  matrix,
  personalYear,
  relationships,
  repetitionEffects,
  sectorEffects,
  sectorTranslating
}: {
  dob: string;
  fullName: string;
  gender: string;
  language: ReturnType<typeof useTranslation>["language"];
  t: ReturnType<typeof useTranslation>["t"];
  loShu: ReturnType<typeof useNumerologyReport>["loShu"];
  matrix: ReturnType<typeof useNumerologyReport>["matrix"];
  personalYear: ReturnType<typeof useNumerologyReport>["personalYear"];
  relationships: ReturnType<typeof useNumerologyReport>["relationships"];
  repetitionEffects: ReturnType<typeof useNumerologyReport>["repetitionEffects"];
  sectorEffects: ReturnType<typeof useNumerologyReport>["currentSectorEffects"];
  sectorTranslating: ReturnType<typeof useNumerologyReport>["sectorTranslating"];
}): Promise<NumerologyExportSection[]> {
  const personalityNumber = Number(loShu?.driverNumber);
  const destinyNumber = Number(loShu?.destinyNumber);
  const relationStatus = getRelationStatus(relationships || [], personalityNumber, destinyNumber);
  const relationRows = [
    { label: "Personality", number: personalityNumber, relationship: findRelationship(relationships || [], personalityNumber) },
    { label: "Destiny", number: destinyNumber, relationship: findRelationship(relationships || [], destinyNumber) }
  ];
  const sortedRepetitionEffects = [...(repetitionEffects || [])].sort(
    (first, second) => Number(first.loShuNumber || 0) - Number(second.loShuNumber || 0)
  );
  const repetitionGeneralNote = sortedRepetitionEffects.find((item) => item.generalNote?.trim())?.generalNote;
  const [personalityDetails, destinyDetails] = await Promise.all([
    fetchPersonalityDestinyExportDetails("PERSONALITY", personalityNumber, language),
    fetchPersonalityDestinyExportDetails("DESTINY", destinyNumber, language)
  ]);
  const translationMap = await buildLoShuExportTranslationMap({
    language,
    personalYear,
    repetitionEffects: sortedRepetitionEffects,
    repetitionGeneralNote,
    sectorEffects
  });
  const tx = (text: string) => translateExportText(text, translationMap, t);

  return [
    {
      title: tx("Lo Shu Grid"),
      variant: "intro",
      rows: [[tx("Birth-date numbers arranged to reveal strengths, missing energies, and life patterns.")]]
    },
    {
      title: tx("Person Details"),
      rows: [
        [tx("Full Name"), tx("Date of Birth"), tx("Gender")],
        [fullName, localizeDigitsInText(dob, language), tx(gender)]
      ]
    },
    {
      title: tx("Lo Shu Grid"),
      variant: "loShuGrid",
      rows: [
        [tx("Top Row"), ...(loShu?.grid?.topRow || []).map((value) => localizeDigitsInText(value, language))],
        [tx("Middle Row"), ...(loShu?.grid?.middleRow || []).map((value) => localizeDigitsInText(value, language))],
        [tx("Bottom Row"), ...(loShu?.grid?.bottomRow || []).map((value) => localizeDigitsInText(value, language))]
      ]
    },
    {
      title: tx("Numbers"),
      variant: "summary",
      rows: [
        [tx("Personality Number"), localizeDigitsInText(loShu?.driverNumber ?? "-", language), tx("Inner Nature")],
        [tx("Destiny Number"), localizeDigitsInText(loShu?.destinyNumber ?? "-", language), tx("Life Path")],
        [tx("Kua Number"), localizeDigitsInText(loShu?.kuaNumber ?? "-", language), tx("Personal Energy")],
        [tx("Name Number"), localizeDigitsInText(loShu?.nameNumber ?? "-", language), tx("Compound")],
        [tx("Running Age"), localizeDigitsInText(loShu?.runningAge ?? "-", language), tx("Years")],
        [tx("Zodiac"), localizeDigitsInText(loShu?.zodiacNumber ?? "-", language), loShu?.zodiacSign ? tx(loShu.zodiacSign) : tx("Zodiac Sign")]
      ]
    },
    {
      title: tx("Check Personality and Destiny Details"),
      variant: "detailButton",
      rows: [
        [tx("Check Personality and Destiny Details")],
        [`${tx("Personality")} ${localizeDigitsInText(loShu?.driverNumber ?? "-", language)}  |  ${tx("Destiny")} ${localizeDigitsInText(loShu?.destinyNumber ?? "-", language)}`]
      ]
    },
    ...buildPersonalityDestinyExportSections("PERSONALITY", personalityNumber, personalityDetails, language, tx),
    ...buildPersonalityDestinyExportSections("DESTINY", destinyNumber, destinyDetails, language, tx),
    {
      title: tx("Current Personal Period"),
      variant: "summary",
      rows: [
        [tx("Current Personal Year"), localizeDigitsInText(personalYear?.personalYear ?? "-", language), ""],
        [tx("Current Personal Month"), localizeDigitsInText(personalYear?.personalMonth ?? "-", language), ""],
        [tx("Current Personal Day"), localizeDigitsInText(personalYear?.personalDay ?? "-", language), ""]
      ]
    },
    {
      title: tx("Relationships"),
      rows: [
        [tx("Number"), tx("Friend"), tx("Enemy"), tx("Neutral")],
        ...relationRows.map(({ label, number, relationship }) => [
          `${tx(label)} ${localizeDigitsInText(Number.isFinite(number) ? number : "-", language)}`,
          localizeDigitsInText(relationship?.friendNumbers || "-", language),
          localizeDigitsInText(relationship?.enemyNumbers || "-", language),
          localizeDigitsInText(relationship?.neutralNumbers || "-", language)
        ]),
        [
          tx("Relation in Personality & Destiny Number"),
          `${localizeDigitsInText(`${loShu?.driverNumber ?? "-"}:${loShu?.destinyNumber ?? "-"}`, language)} = ${tx(relationStatus)}`,
          "",
          ""
        ]
      ]
    },
    {
      title: tx("Lo Shu Grid Number Effects"),
      variant: "repetitionEffects",
      rows: [
        buildRepetitionGridExportRow(sortedRepetitionEffects, language, tx),
        ...sortedRepetitionEffects.map((effect) => [
          localizeDigitsInText(tx(effect.title || "-"), language),
          localizeDigitsInText(tx(effect.meaning || "No data available."), language)
        ]),
        ...(repetitionGeneralNote ? [["", tx(repetitionGeneralNote), "note"]] : [])
      ]
    },
    {
      title: tx("Lo Shu Grid Number Effects"),
      rows: [
        [tx("Number"), tx("Repetition Count"), tx("Title"), tx("Meaning")],
        ...sortedRepetitionEffects.map((effect) => [
          localizeDigitsInText(effect.loShuNumber ?? "-", language),
          localizeDigitsInText(effect.repetitionCount ?? "-", language),
          localizeDigitsInText(tx(effect.title || "-"), language),
          localizeDigitsInText(tx(effect.meaning || "No data available."), language)
        ]),
        ...(repetitionGeneralNote ? [[tx("General Note"), "", "", tx(repetitionGeneralNote)]] : [])
      ]
    },
    {
      title: tx("Matrix for Personal Year & Month"),
      layout: "wide",
      rows: [
        [tx("Year"), tx("Personal Year"), tx("Jan"), tx("Feb"), tx("Mar"), tx("Apr"), tx("May"), tx("Jun"), tx("Jul"), tx("Aug"), tx("Sep"), tx("Oct"), tx("Nov"), tx("Dec")],
        ...(matrix || []).map((row) => [
          localizeDigitsInText(row.year, language),
          localizeDigitsInText(row.personalYear || "-", language),
          ...months.map(([shortMonth, fullMonth]) => localizeDigitsInText(getMonthValue(row, shortMonth, fullMonth), language))
        ])
      ]
    },
    {
      title: tx("Sector Wise Effects"),
      variant: "effects",
      rows: [
        [tx("Combination Key"), localizeDigitsInText(sectorEffects?.combinationKey || "-", language)],
        ...sectorEffectTabs.map((tab) => [
          tx(tab.title),
          sectorTranslating ? tx("Translating...") : tx(sectorEffects?.[tab.dataKey]?.trim() || "No data available."),
          tab.color
        ])
      ]
    },
    {
      title: tx("Personal Year reading"),
      variant: "reading",
      rows: [
        ...personalYearNotes.map((note, index) => [
          index === 0 && personalYear?.personalYear ? `${tx("Your running personal year is")} ${localizeDigitsInText(personalYear.personalYear, language)}.` : tx(note)
        ])
      ]
    }
  ];
}

async function fetchPersonalityDestinyExportDetails(
  type: PersonalityDestinyType,
  numberValue: number,
  language: ReturnType<typeof useTranslation>["language"]
) {
  if (!Number.isFinite(numberValue) || numberValue <= 0) return null;
  const details = await getPersonalityDestinyDetails(type, numberValue);
  return language === "en" ? details : translatePersonalityDestinyDetails(details, language);
}

function buildPersonalityDestinyExportSections(
  type: PersonalityDestinyType,
  numberValue: number,
  details: PersonalityDestinyDetailsResponse | null,
  language: ReturnType<typeof useTranslation>["language"],
  tx: (text: string) => string
): NumerologyExportSection[] {
  const titleType = type === "PERSONALITY" ? tx("Personality") : tx("Destiny");

  if (!details) {
    return [{
      title: `${titleType} ${tx("Details")}`,
      rows: [[tx("Details not available")]]
    }];
  }

  const sections = getPersonalityDestinySections(details);
  const firstItem = sections.flatMap(({ items }) => items).find((item) => item?.lord || item?.colour);

  return [{
    title: `${titleType} ${tx("Details")}`,
    variant: "details",
    rows: [
      [
        `${titleType} ${tx("Number")} ${localizeDigitsInText(Number.isFinite(numberValue) ? numberValue : "-", language)}`,
        firstItem?.lord ? `${tx("Lord")}: ${firstItem.lord.trim()}` : "",
        firstItem?.colour ? `${tx("Colour")}: ${firstItem.colour.trim()}` : ""
      ],
      ...sections.map(({ title, items }) => [
        `${tx(title)} ${tx("of")} ${titleType} ${tx("Number")} ${localizeDigitsInText(Number.isFinite(numberValue) ? numberValue : items[0]?.numberValue || "-", language)}`,
        ...items.map((item) => item.value || "")
      ])
    ]
  }];
}

async function buildLoShuExportTranslationMap({
  language,
  personalYear,
  repetitionEffects,
  repetitionGeneralNote,
  sectorEffects
}: {
  language: ReturnType<typeof useTranslation>["language"];
  personalYear: ReturnType<typeof useNumerologyReport>["personalYear"];
  repetitionEffects: ReturnType<typeof useNumerologyReport>["repetitionEffects"];
  repetitionGeneralNote?: string;
  sectorEffects: ReturnType<typeof useNumerologyReport>["currentSectorEffects"];
}) {
  const exportTexts = [
    "Lo Shu Grid",
    "Birth-date numbers arranged to reveal strengths, missing energies, and life patterns.",
    "Person Details",
    "Full Name",
    "Date of Birth",
    "Gender",
    "Male",
    "Female",
    "Other",
    "Top Row",
    "Middle Row",
    "Bottom Row",
    "Numbers",
    "Personality Number",
    "Destiny Number",
    "Kua Number",
    "Name Number",
    "Running Age",
    "Zodiac",
    "Zodiac Sign",
    "Inner Nature",
    "Life Path",
    "Personal Energy",
    "Compound",
    "Years",
    "Check Personality and Destiny Details",
    "Personality",
    "Destiny",
    "Current Personal Period",
    "Current Personal Year",
    "Current Personal Month",
    "Current Personal Day",
    "Relationships",
    "Number",
    "Friend",
    "Enemy",
    "Neutral",
    "Unknown",
    "Relation in Personality & Destiny Number",
    "Lo Shu Grid Number Effects",
    "Meaning of repetition",
    "Missing",
    "Repetition Count",
    "Title",
    "Meaning",
    "General Note",
    "Matrix for Personal Year & Month",
    "Personal Year",
    "Year",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Sector Wise Effects",
    "Combination Key",
    "Career",
    "Health",
    "Finance",
    "Relationship",
    "Translating...",
    "No data available.",
    "Personal Year reading",
    "Your running personal year is",
    "Details",
    "Details not available",
    "Lord",
    "Colour",
    "of",
    ...(personalYearNotes || []),
    ...(repetitionEffects || []).flatMap((effect) => [effect.title, effect.meaning].filter((value): value is string => Boolean(value?.trim()))),
    ...(repetitionGeneralNote ? [repetitionGeneralNote] : []),
    ...sectorEffectTabs.map((tab) => tab.title),
    ...sectorEffectTabs
      .map((tab) => sectorEffects?.[tab.dataKey])
      .filter((value): value is string => Boolean(value?.trim())),
    ...(personalYear?.personalYear ? [] : [])
  ];

  return translateUniqueTexts(exportTexts, language);
}

function translateExportText(
  text: string,
  translationMap: Map<string, string>,
  t: ReturnType<typeof useTranslation>["t"]
) {
  return translationMap.get(text) || t(text);
}

function buildRepetitionGridExportRow(
  effects: ReturnType<typeof useNumerologyReport>["repetitionEffects"],
  language: ReturnType<typeof useTranslation>["language"],
  tx: (text: string) => string
): NumerologyExportRow {
  const cells = Array.from({ length: 9 }, (_, index) => {
    const row = Math.floor(index / 3) + 1;
    const column = (index % 3) + 1;
    const loShuNumber = Number(defaultGridCells[index]);
    const effect =
      effects.find((item) => Number(item.gridRow) === row && Number(item.gridColumn) === column) ||
      effects.find((item) => Number(item.loShuNumber) === loShuNumber);
    const count = Number(effect?.repetitionCount || 0);
    const numberText = String(effect?.loShuNumber ?? defaultGridCells[index] ?? "-");
    const cellText = count > 0 ? numberText.repeat(count) : numberText;
    const status = !count ? "|missing" : count >= 3 ? "|many" : "";

    return `${localizeDigitsInText(cellText, language)}${status}`;
  });

  return [...cells, tx("Meaning of repetition"), tx("Missing")];
}
