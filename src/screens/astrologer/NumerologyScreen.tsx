import { useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { type LanguageCode, useTranslation } from "@/context/LanguageContext";
import {
  getLoShuGrid,
  getLoShuRepetitionEffects,
  getNumberRelationships,
  getPersonalityDestinyDetails,
  getPersonalYear,
  getPersonalYearMatrix,
  getSectorWiseEffects,
  LoShuGridResponse,
  LoShuRepetitionCountsPayload,
  LoShuRepetitionEffectItem,
  NumberRelationshipItem,
  PersonalityDestinyDetailsResponse,
  PersonalityDestinyType,
  PersonalYearMatrixItem,
  PersonalYearResponse,
  SectorWiseEffectsResponse
} from "@/services/numerology.service";
import { getApiErrorMessage } from "@/services/apiClient";
import { translateUniqueTexts } from "@/services/translation.service";

type Gender = "Male" | "Female" | "Other";
type Calculation = "lo-shu-grid" | "vedic-grid" | "pythagoras-grid" | "name-frequency" | "daily-numeroscope";
type SectorEffectTab = "career" | "health" | "finance" | "relationship";

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
const defaultGridCells = [defaultGrid.topRow, defaultGrid.middleRow, defaultGrid.bottomRow].flat();
const sectorEffectTabs: {
  key: SectorEffectTab;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  dataKey: keyof Pick<SectorWiseEffectsResponse, "careerEffect" | "healthEffect" | "financeEffect" | "relationshipEffect">;
}[] = [
  { key: "career", title: "Career", icon: "briefcase", color: "#148f36", dataKey: "careerEffect" },
  { key: "health", title: "Health", icon: "heart-pulse", color: "#d71920", dataKey: "healthEffect" },
  { key: "finance", title: "Finance", icon: "cash", color: "#1967d2", dataKey: "financeEffect" },
  { key: "relationship", title: "Relationship", icon: "heart-broken", color: "#c2187a", dataKey: "relationshipEffect" }
];
const personalYearNotes = [
  "Your running personal year shows where effort and results will concentrate.",
  "This year rewards consistent hard work and practical planning.",
  "A favourable time to buy, sell, or recover pending funds.",
  "Avoid business expansion until the existing venture is stronger.",
  "Useful connections may be established through focused communication."
];
const minimumDobDate = new Date(1900, 0, 1);
const detailSections = [
  ["coreCharacteristics", "Core Characteristics"],
  ["commonPitfalls", "Common Pitfalls"],
  ["primaryHealthVulnerabilities", "Primary Health Vulnerabilities"],
  ["topCareerRoles", "Top Career Roles"],
  ["topCareerSectors", "Top Career Sectors"]
] as const;
const detailSectionOrder: string[] = detailSections.map(([key]) => key);
const localizedDigits: Record<LanguageCode, string[]> = {
  en: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  hi: ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"],
  mr: ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"],
  bn: ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"],
  ta: ["௦", "௧", "௨", "௩", "௪", "௫", "௬", "௭", "௮", "௯"],
  te: ["౦", "౧", "౨", "౩", "౪", "౫", "౬", "౭", "౮", "౯"]
};

export function NumerologyScreen() {
  const { t } = useTranslation();
  const formParams = useLocalSearchParams<{ fullName?: string; dob?: string; gender?: Gender; calculation?: Calculation }>();
  const [fullName, setFullName] = useState(String(formParams.fullName || ""));
  const [dob, setDob] = useState(String(formParams.dob || ""));
  const [gender, setGender] = useState<Gender>(formParams.gender || "Male");
  const [calculation, setCalculation] = useState<Calculation>(formParams.calculation || "lo-shu-grid");
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

  useEffect(() => {
    if (formParams.fullName !== undefined) setFullName(String(formParams.fullName));
    if (formParams.dob !== undefined) setDob(String(formParams.dob));
    if (formParams.gender) setGender(formParams.gender);
    if (formParams.calculation) setCalculation(formParams.calculation);
  }, [formParams.calculation, formParams.dob, formParams.fullName, formParams.gender]);

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
  const clearForm = () => {
    setFullName("");
    setDob("");
    setSubmitted(false);
    setCalculationOpen(false);
    setShowDobPicker(false);
  };
  const hasFormData = Boolean(fullName.trim() || dob.trim());

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.replace("/astrologer")}>{t("Back")}</Button>
        <Text variant="headlineSmall" style={styles.headerTitle}>{t("Numerology")}</Text>
        <LanguageSelector />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <View style={styles.formStack}>
            <FieldIcon icon="account" />
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("Full Name")}
              placeholderTextColor="#9c9c9c"
              style={styles.input}
            />
          </View>
          <View style={styles.formStack}>
            <FieldIcon icon="calendar-month" />
            <Pressable style={styles.dateSelect} onPress={() => setShowDobPicker(true)}>
              <Text style={[styles.dateSelectText, !dob && styles.placeholderText]}>{dob || t("Date of Birth (DD-MM-YYYY)")}</Text>
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
                <Text style={[styles.genderText, gender === item && styles.genderTextActive]}>{t(item)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.formStack}>
            <FieldIcon icon="arrow-down-circle" />
            <View style={styles.calculationSelect}>
              <Pressable style={styles.calculationTrigger} onPress={() => setCalculationOpen((open) => !open)}>
                <Text style={styles.calculationValue}>{t(calculationOptions.find((item) => item.value === calculation)?.label || "")}</Text>
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
                        {t(item.label)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
          {submitted && !canSubmit ? (
            <Text style={styles.validation}>
              {calculation !== "lo-shu-grid" ? t("Please select Lo Shu Grid calculation.") : t("Enter full name, DOB, and gender.")}
            </Text>
          ) : null}
          <View style={styles.actionRow}>
            {hasFormData ? (
              <Pressable style={styles.clearBtn} onPress={clearForm}>
                <MaterialCommunityIcons name="close-circle-outline" size={18} color="#111" />
                <Text style={styles.clearText}>{t("Clear")}</Text>
              </Pressable>
            ) : null}
            <Pressable style={[styles.submitBtn, styles.submitBtnFlex]} onPress={submit}>
              <Text style={styles.submitText}>{t("Submit")}</Text>
            </Pressable>
          </View>
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
  const { language, t } = useTranslation();
  const params = useLocalSearchParams<{ fullName?: string; dob?: string; gender?: string; calculation?: Calculation }>();
  const fullName = String(params.fullName || "");
  const dob = String(params.dob || "");
  const gender = String(params.gender || "Male");
  const currentYear = new Date().getFullYear();
  const [loShu, setLoShu] = useState<LoShuGridResponse | null>(null);
  const [personalYear, setPersonalYear] = useState<PersonalYearResponse | null>(null);
  const [matrix, setMatrix] = useState<PersonalYearMatrixItem[]>([]);
  const [relationships, setRelationships] = useState<NumberRelationshipItem[]>([]);
  const [sectorEffects, setSectorEffects] = useState<SectorWiseEffectsResponse | null>(null);
  const [repetitionEffects, setRepetitionEffects] = useState<LoShuRepetitionEffectItem[]>([]);
  const [translatedSectorEffects, setTranslatedSectorEffects] = useState<Partial<Record<LanguageCode, SectorWiseEffectsResponse>>>({});
  const [sectorTranslating, setSectorTranslating] = useState(false);
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
        const personalityNo = Number(grid.driverNumber);
        const destinyNo = Number(grid.destinyNumber);
        const repetitionPayload = buildLoShuCountsPayload(grid.counts);
        const [year, yearMatrix, relationshipRows, effects, repetitionRows] = await Promise.all([
          getPersonalYear(payload),
          getPersonalYearMatrix(dob, currentYear, currentYear + 10),
          Number.isFinite(personalityNo) && Number.isFinite(destinyNo)
            ? getNumberRelationships(personalityNo, destinyNo)
            : Promise.resolve([]),
          Number.isFinite(personalityNo) && Number.isFinite(destinyNo)
            ? getSectorWiseEffects(personalityNo, destinyNo)
            : Promise.resolve(null),
          repetitionPayload ? getLoShuRepetitionEffects(repetitionPayload) : Promise.resolve([])
        ]);
        if (!mounted) return;
        setPersonalYear(year);
        setMatrix(yearMatrix);
        setRelationships(relationshipRows);
        setSectorEffects(effects);
        setRepetitionEffects(repetitionRows);
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

  const translatedCurrentSectorEffects = translatedSectorEffects[language];
  const currentSectorEffects = language === "en" ? sectorEffects : translatedCurrentSectorEffects || null;

  useEffect(() => {
    let mounted = true;

    async function translateSectorEffects() {
      if (language === "en" || !sectorEffects || translatedCurrentSectorEffects) {
        setSectorTranslating(false);
        return;
      }

      try {
        setSectorTranslating(true);
        const nextEffects = await translateSectorWiseEffects(sectorEffects, language);
        if (!mounted) return;
        setTranslatedSectorEffects((current) => ({
          ...current,
          [language]: nextEffects
        }));
      } finally {
        if (mounted) setSectorTranslating(false);
      }
    }

    translateSectorEffects();
    return () => {
      mounted = false;
    };
  }, [language, sectorEffects, translatedCurrentSectorEffects]);

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
        <Text variant="headlineSmall" style={styles.headerTitle}>{t("Numerology")}</Text>
        <LanguageSelector />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
        
        <SectionLabel title={t("Lo Shu Grid")} />
        <LoShuGrid grid={loShu?.grid} />
        <View style={styles.cardGrid}>
          <NumberCard label={t("Personality Number")} value={loShu?.driverNumber} note={t("Inner Nature")} />
          <NumberCard label={t("Destiny Number")} value={loShu?.destinyNumber} note={t("Life Path")} />
          <NumberCard label={t("Kua Number")} value={loShu?.kuaNumber} note={t("Personal Energy")} />
          <NumberCard label={t("Name Number")} value={loShu?.nameNumber} note={t("Compound")} />
          <NumberCard label={t("Running Age")} value={loShu?.runningAge} note={t("Years")} />
          <NumberCard label={t("Zodiac")} value={loShu?.zodiacNumber} note={loShu?.zodiacSign || t("Zodiac Sign")} />
        </View>
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
        <SectionLabel title={t("Matrix for Personal Year & Month")} />
        <View style={styles.yearInputs}>
          <TextInput value={fromYear} onChangeText={setFromYear} keyboardType="number-pad" placeholder={t("From Year")} style={styles.yearInput} />
          <TextInput value={toYear} onChangeText={setToYear} keyboardType="number-pad" placeholder={t("To Year")} style={styles.yearInput} />
          <Pressable style={styles.smallBtn} onPress={refreshMatrix} disabled={matrixLoading}>
            <Text style={styles.smallBtnText}>{matrixLoading ? t("Loading") : t("Apply")}</Text>
          </Pressable>
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

export function PersonalityDestinyScreen() {
  const { language, t } = useTranslation();
  const params = useLocalSearchParams<{ personalityNumber?: string; destinyNumber?: string; tab?: PersonalityDestinyType }>();
  const [activeTab, setActiveTab] = useState<PersonalityDestinyType>(params.tab === "DESTINY" ? "DESTINY" : "PERSONALITY");
  const [rawDetails, setRawDetails] = useState<Partial<Record<PersonalityDestinyType, PersonalityDestinyDetailsResponse>>>({});
  const [translatedDetails, setTranslatedDetails] = useState<
    Partial<Record<PersonalityDestinyType, Partial<Record<LanguageCode, PersonalityDestinyDetailsResponse>>>>
  >({});
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const personalityNumber = Number(params.personalityNumber);
  const destinyNumber = Number(params.destinyNumber);
  const activeNumber = activeTab === "PERSONALITY" ? personalityNumber : destinyNumber;

  useEffect(() => {
    let mounted = true;
    async function loadDetails() {
      if (!Number.isFinite(activeNumber) || activeNumber <= 0) {
        setError(`Unable to find ${activeTab.toLowerCase()} number from Lo Shu Grid.`);
        return;
      }
      if (rawDetails[activeTab]) return;
      try {
        setLoading(true);
        setError(null);
        const response = await getPersonalityDestinyDetails(activeTab, activeNumber);
        if (mounted) setRawDetails((current) => ({ ...current, [activeTab]: response }));
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, `Unable to load ${activeTab.toLowerCase()} details`));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDetails();
    return () => {
      mounted = false;
    };
  }, [activeNumber, activeTab, rawDetails]);

  const rawCurrentDetails = rawDetails[activeTab];
  const translatedCurrentDetails = translatedDetails[activeTab]?.[language];
  const currentDetails = language === "en" ? rawCurrentDetails : translatedCurrentDetails;

  useEffect(() => {
    let mounted = true;

    async function translateDetails() {
      if (language === "en" || !rawCurrentDetails || translatedCurrentDetails) {
        setTranslating(false);
        return;
      }

      try {
        setTranslating(true);
        const nextDetails = await translatePersonalityDestinyDetails(rawCurrentDetails, language);
        if (!mounted) return;
        setTranslatedDetails((current) => ({
          ...current,
          [activeTab]: {
            ...current[activeTab],
            [language]: nextDetails
          }
        }));
      } finally {
        if (mounted) setTranslating(false);
      }
    }

    translateDetails();
    return () => {
      mounted = false;
    };
  }, [activeTab, language, rawCurrentDetails, translatedCurrentDetails]);

  const detailsLoading = loading || translating;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
        <Text variant="headlineSmall" style={styles.headerTitle}>{t("Numerology")}</Text>
        <LanguageSelector />
      </View>
      <View style={styles.detailContainer}>
        <View style={styles.detailTabs}>
          {(["PERSONALITY", "DESTINY"] as PersonalityDestinyType[]).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.detailTab, activeTab === tab && styles.detailTabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.detailTabText, activeTab === tab && styles.detailTabTextActive]}>
                {tab === "PERSONALITY" ? t("Personality") : t("Destiny")}
              </Text>
            </Pressable>
          ))}
        </View>
        </View>
<ScrollView style={styles.scroll} contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        {detailsLoading ? <LoadingState label={translating ? `Translating ${activeTab.toLowerCase()} details` : `Loading ${activeTab.toLowerCase()} details`} /> : null}
        {error && !detailsLoading ? <ErrorState message={error} onRetry={() => setRawDetails((current) => ({ ...current, [activeTab]: undefined }))} /> : null}
        {!detailsLoading && !error && currentDetails ? (
          <PersonalityDestinyDetails type={activeTab} numberValue={activeNumber} details={currentDetails} />
        ) : null}
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
  const { language } = useTranslation();
  const rows = [grid?.topRow, grid?.middleRow, grid?.bottomRow].map((row, index) => row || Object.values(defaultGrid)[index]);
  return (
    <View style={styles.loShuGrid}>
      {rows.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => (
          <View key={`${rowIndex}-${colIndex}`} style={styles.loShuCell}>
            <Text style={styles.loShuText}>{localizeDigitsInText(value || "-", language)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function LoShuRepetitionEffectsSection({ effects }: { effects: LoShuRepetitionEffectItem[] }) {
  const { language, t } = useTranslation();
  const sortedEffects = [...effects].sort((first, second) => Number(first.loShuNumber || 0) - Number(second.loShuNumber || 0));
  const generalNote = sortedEffects.find((item) => item.generalNote?.trim())?.generalNote;

  if (!sortedEffects.length) return null;

  return (
    <View style={styles.repetitionSection}>
      <View style={styles.repetitionHero}>
        <View style={styles.repetitionHeroCopy}>
          <Text style={styles.repetitionKicker}>{t("Meaning of repetition")}</Text>
          <Text style={styles.repetitionTitle}>{t("Lo Shu Grid Number Effects")}</Text>
        </View>
        <RepetitionGrid effects={sortedEffects} />
      </View>
      <View style={styles.repetitionCards}>
        {sortedEffects.map((effect) => (
          <View key={`${effect.loShuNumber}-${effect.id || effect.repetitionCount}`} style={styles.repetitionCard}>
            <View style={styles.repetitionIcon}>
              <MaterialCommunityIcons name={getRepetitionIcon(effect.repetitionCount)} size={30} color="#1255c8" />
            </View>
            <View style={styles.repetitionCopy}>
              <Text style={[styles.repetitionCardTitle, getRepetitionTitleStyle(effect.repetitionCount)]}>
                {localizeDigitsInText(t(effect.title || "-"), language)}
              </Text>
              <Text style={styles.repetitionCardText}>{localizeDigitsInText(t(effect.meaning || t("No data available.")), language)}</Text>
            </View>
          </View>
        ))}
      </View>
      {generalNote ? (
        <View style={styles.repetitionNoteRow}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#07225f" />
          <Text style={styles.repetitionNote}>{t(generalNote)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function RepetitionGrid({ effects }: { effects: LoShuRepetitionEffectItem[] }) {
  const { language, t } = useTranslation();
  const cells = Array.from({ length: 9 }, (_, index) => {
    const row = Math.floor(index / 3) + 1;
    const column = (index % 3) + 1;
    const loShuNumber = Number(defaultGridCells[index]);
    return (
      effects.find((item) => Number(item.gridRow) === row && Number(item.gridColumn) === column) ||
      effects.find((item) => Number(item.loShuNumber) === loShuNumber) || {
        loShuNumber,
        gridRow: row,
        gridColumn: column,
        repetitionCount: 0
      }
    );
  });

  return (
    <View style={styles.repetitionGrid}>
      {cells.map((effect, index) => {
        const count = Number(effect?.repetitionCount || 0);
        const numberText = String(effect?.loShuNumber ?? defaultGridCells[index] ?? "-");
        const cellText = count > 0 ? numberText.repeat(count) : numberText;
        return (
          <View
            key={`${effect?.loShuNumber || index}-${index}`}
            style={[styles.repetitionGridCell, count > 0 ? styles.repetitionGridCellActive : styles.repetitionGridCellMissing]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
              style={[
                styles.repetitionGridNumber,
                !count && styles.repetitionGridNumberMissing,
                count >= 3 && styles.repetitionGridNumberMany
              ]}
            >
              {localizeDigitsInText(cellText, language)}
            </Text>
            {!count ? <Text style={styles.repetitionGridMissingLabel}>{t("Missing")}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function NumberCard({ label, value, note }: { label: string; value?: string | number; note?: string }) {
  const { language } = useTranslation();
  return (
    <View style={styles.numberCard}>
      <Text style={styles.numberLabel}>{label}</Text>
      <Text style={styles.numberValue}>{localizeDigitsInText(value ?? "-", language)}</Text>
      {note ? <Text style={styles.numberNote} numberOfLines={1}>{note}</Text> : null}
    </View>
  );
}

function RelationTable({
  relationships,
  personalityNo,
  destinyNo
}: {
  relationships: NumberRelationshipItem[];
  personalityNo?: number;
  destinyNo?: number;
}) {
  const { language, t } = useTranslation();
  const relationRows = [
    { label: "Personality", number: personalityNo, relationship: findRelationship(relationships, personalityNo) },
    { label: "Destiny", number: destinyNo, relationship: findRelationship(relationships, destinyNo) }
  ];
  const relationStatus = getRelationStatus(relationships, personalityNo, destinyNo);

  return (
    <ScrollView >
      <View style={styles.relationTable}>
        <View style={styles.relationHeader}>
          <Text style={[styles.relationHeadText, styles.relationNumberHead]}>{t("Number")}</Text>
          <Text style={[styles.relationHeadText, styles.relationFriendHead]}>{t("Friend")}</Text>
          <Text style={[styles.relationHeadText, styles.relationEnemyHead]}>{t("Enemy")}</Text>
          <Text style={[styles.relationHeadText, styles.relationNeutralHead]}>{t("Neutral")}</Text>
        </View>
        {relationRows.map(({ label, number, relationship }) => (
          <View key={label} style={styles.relationRow}>
            <Text style={[styles.relationLabel, styles.relationNameCell]}>{t(label)}</Text>
            <Text style={[styles.relationCell, styles.relationNumberCell]}>{localizeDigitsInText(number ?? "-", language)}</Text>
            <Text style={[styles.relationCell, styles.relationFriendCell, styles.friendText]}>{localizeDigitsInText(relationship?.friendNumbers || "-", language)}</Text>
            <Text style={[styles.relationCell, styles.relationEnemyCell, styles.enemyText]}>{localizeDigitsInText(relationship?.enemyNumbers || "-", language)}</Text>
            <Text style={[styles.relationCell, styles.relationNeutralCell, styles.neutralText]}>{localizeDigitsInText(relationship?.neutralNumbers || "-", language)}</Text>
          </View>
        ))}
        <View style={styles.relationFoot}>
          <Text style={[styles.relationLabel, styles.relationFootLabel]}>{t("Relation in Personality\n& Destiny Number")}</Text>
          <Text style={styles.relationFootValue}>
            {localizeDigitsInText(`${personalityNo ?? "-"}:${destinyNo ?? "-"}`, language)} = {t(relationStatus)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function SectorWiseEffects({ effects, translating }: { effects: SectorWiseEffectsResponse | null; translating: boolean }) {
  const { language, t } = useTranslation();

  return (
    <View style={styles.effectsBox}>
      {effects?.combinationKey ? (
        <View style={styles.combinationBadge}>
          <Text style={styles.combinationLabel}>{t("Combination Key")}</Text>
          <Text style={styles.combinationValue}>{localizeDigitsInText(effects.combinationKey, language)}</Text>
        </View>
      ) : null}
      <View style={styles.effectPanels}>
        {sectorEffectTabs.map((tab) => {
          const effectText = translating ? t("Translating...") : effects?.[tab.dataKey]?.trim() || t("No data available.");
          return (
            <View key={tab.key} style={styles.effectPanel}>
              <View style={[styles.effectIcon, { backgroundColor: tab.color }]}>
                <MaterialCommunityIcons name={tab.icon} size={25} color="#fff" />
              </View>
              <View style={styles.effectCopy}>
                <Text style={[styles.effectTitle, { color: tab.color }]}>{t(tab.title)}</Text>
                <Text style={styles.effectText}>{effectText}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function findRelationship(relationships: NumberRelationshipItem[], number?: number) {
  return relationships.find((item) => Number(item.planetNumber) === Number(number));
}

function getRelationStatus(relationships: NumberRelationshipItem[], personalityNo?: number, destinyNo?: number) {
  const personalityRelationship = findRelationship(relationships, personalityNo);
  const destinyValue = String(destinyNo);

  if (!personalityRelationship || !Number.isFinite(Number(destinyNo))) return "Unknown";
  if (numberListIncludes(personalityRelationship.friendNumbers, destinyValue)) return "Friend";
  if (numberListIncludes(personalityRelationship.enemyNumbers, destinyValue)) return "Enemy";
  if (numberListIncludes(personalityRelationship.neutralNumbers, destinyValue)) return "Neutral";

  return "Unknown";
}

function numberListIncludes(value: string | undefined, target: string) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .includes(target);
}

function localizeDigitsInText(value: string | number, language: LanguageCode) {
  const digits = localizedDigits[language] || localizedDigits.en;
  return String(value).replace(/\d/g, (digit) => digits[Number(digit)] || digit);
}

function buildLoShuCountsPayload(counts?: Record<string, number>) {
  if (!counts) return null;

  return Array.from({ length: 9 }, (_, index) => String(index + 1)).reduce((payload, numberKey) => {
    payload[numberKey as keyof LoShuRepetitionCountsPayload] = Number(counts[numberKey] || 0);
    return payload;
  }, {} as LoShuRepetitionCountsPayload);
}

function getRepetitionIcon(count?: number): keyof typeof MaterialCommunityIcons.glyphMap {
  if (!count) return "selection-remove";
  if (count === 1) return "account-outline";
  if (count === 2) return "account-multiple-outline";
  return "account-group-outline";
}

function getRepetitionTitleStyle(count?: number) {
  if (!count) return styles.repetitionTitleMissing;
  if (count === 1) return styles.repetitionTitleOnce;
  if (count === 2) return styles.repetitionTitleTwice;
  return styles.repetitionTitleMany;
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
  const { language, t } = useTranslation();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.matrixTable}>
        <View style={styles.matrixTopHeader}>
          <Text style={[styles.matrixHeadCell, styles.matrixYear, styles.matrixTallHead]}>{t("Year")}</Text>
          <Text style={[styles.matrixHeadCell, styles.matrixPersonal, styles.matrixTallHead]}>{t("Personal\nYear")}</Text>
          <Text style={styles.matrixMonthGroup}>{t("Personal Month")}</Text>
        </View>
        <View style={styles.matrixMonthHeader}>
          <View style={[styles.matrixHeadSpacer, styles.matrixYear]} />
          <View style={[styles.matrixHeadSpacer, styles.matrixPersonal]} />
          {months.map(([shortMonth]) => <Text key={shortMonth} style={styles.matrixHeadCell}>{t(shortMonth)}</Text>)}
        </View>
        {rows.map((row) => (
          <View key={row.year} style={styles.matrixRow}>
            <Text style={[styles.matrixCell, styles.matrixYear]}>{localizeDigitsInText(row.year, language)}</Text>
            <PersonalYearMatrixValue value={row.personalYear || "-"} language={language} />
            {months.map(([shortMonth, fullMonth]) => (
              <Text key={shortMonth} style={styles.matrixCell}>{localizeDigitsInText(getMonthValue(row, shortMonth, fullMonth), language)}</Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function PersonalYearMatrixValue({ value, language }: { value: string | number; language: LanguageCode }) {
  const text = String(value || "-");
  const slashIndex = text.indexOf("/");

  if (text === "-" || slashIndex === -1) {
    return (
      <View style={[styles.matrixCell, styles.matrixPersonal, styles.matrixPersonalValueCell]}>
        <Text style={styles.matrixPersonalYearText}>{localizeDigitsInText(text, language)}</Text>
      </View>
    );
  }

  const firstValue = text.slice(0, slashIndex);
  const lastValue = text.slice(slashIndex + 1);

  return (
    <View style={[styles.matrixCell, styles.matrixPersonal, styles.matrixPersonalValueCell]}>
      <Text style={styles.matrixPersonalYearText}>
        <Text style={styles.matrixPersonalYearFirst}>{localizeDigitsInText(firstValue, language)}</Text>
        <Text style={styles.matrixPersonalYearSlash}>/</Text>
        <Text style={styles.matrixPersonalYearLast}>{localizeDigitsInText(lastValue, language)}</Text>
      </Text>
    </View>
  );
}

function PersonalYearReading({ value }: { value?: string }) {
  const { language, t } = useTranslation();

  return (
    <View style={styles.readingBox}>
      <Text style={styles.readingTitle}>{t("Personal Year reading")}</Text>
      {personalYearNotes.map((note, index) => (
        <Text key={note} style={styles.readingText}>- {index === 0 && value ? `${t("Your running personal year is")} ${localizeDigitsInText(value, language)}.` : t(note)}</Text>
      ))}
    </View>
  );
}

function PersonalityDestinyDetails({
  type,
  numberValue,
  details
}: {
  type: PersonalityDestinyType;
  numberValue: number;
  details: PersonalityDestinyDetailsResponse;
}) {
  const { language, t } = useTranslation();
  const titleType = type === "PERSONALITY" ? "Personality" : "Destiny";
  const sections = getPersonalityDestinySections(details);
  const firstItem = sections.flatMap(({ items }) => items).find((item) => item?.lord || item?.colour);

  return (
    <View style={styles.detailStack}>
      <View style={styles.detailSummary}>
        <Text style={styles.detailSummaryNumber}>{t(titleType)} {t("Number")} {localizeDigitsInText(numberValue || "-", language)}</Text>
        {firstItem?.lord ? <Text style={styles.detailSummaryText}>{t("Lord")}: {firstItem.lord.trim()}</Text> : null}
        {firstItem?.colour ? <Text style={styles.detailSummaryText}>{t("Colour")}: {firstItem.colour.trim()}</Text> : null}
      </View>

      {sections.map(({ key, title, items }) => (
        <View key={key} style={styles.detailCard}>
          <View style={styles.detailCardTitleWrap}>
            <Text style={styles.detailCardTitle}>
              {t(title)} {t("of")}{"\n"}{t(titleType)} {t("Number")} {localizeDigitsInText(numberValue || items[0]?.numberValue || "-", language)}
            </Text>
          </View>
          <View style={styles.detailBullets}>
            {items.map((item, index) => (
              <View key={`${key}-${index}`} style={styles.detailBulletRow}>
                <Text style={styles.detailBulletDot}>•</Text>
                <DetailPointText value={t(item.value || "")} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function DetailPointText({ value }: { value: string }) {
  const colonIndex = value.indexOf(":");
  if (colonIndex <= 0 || colonIndex > 42) {
    return <Text style={styles.detailBulletText}>{value}</Text>;
  }

  return (
    <Text style={styles.detailBulletText}>
      <Text style={styles.detailBulletLead}>{value.slice(0, colonIndex + 1)}</Text>
      {value.slice(colonIndex + 1)}
    </Text>
  );
}

function getPersonalityDestinySections(details: PersonalityDestinyDetailsResponse) {
  const orderedKeys = [
    ...detailSectionOrder,
    ...Object.keys(details).filter((key) => !detailSectionOrder.includes(key))
  ];

  return orderedKeys
    .map((key) => {
      const configuredSection = detailSections.find(([sectionKey]) => sectionKey === key);
      const items = Array.isArray(details[key])
        ? details[key].filter((item) => Boolean(item?.value?.trim()))
        : [];

      return {
        key,
        title: configuredSection?.[1] || titleizeDetailKey(key),
        items
      };
    })
    .filter((section) => section.items.length);
}

async function translatePersonalityDestinyDetails(details: PersonalityDestinyDetailsResponse, language: LanguageCode) {
  const stringsToTranslate = Object.values(details)
    .flatMap((items) => items || [])
    .flatMap((item) => [item.value, item.lord, item.colour])
    .filter((value): value is string => Boolean(value?.trim()));
  const translations = await translateUniqueTexts(stringsToTranslate, language);
  const translatedEntries = Object.entries(details).map(([key, items]) => [
    key,
    items?.map((item) => ({
      ...item,
      value: item.value ? translations.get(item.value) || item.value : item.value,
      lord: item.lord ? translations.get(item.lord) || item.lord : item.lord,
      colour: item.colour ? translations.get(item.colour) || item.colour : item.colour
    }))
  ]);

  return Object.fromEntries(translatedEntries) as PersonalityDestinyDetailsResponse;
}

async function translateSectorWiseEffects(effects: SectorWiseEffectsResponse, language: LanguageCode) {
  const effectKeys = sectorEffectTabs.map((tab) => tab.dataKey);
  const stringsToTranslate = effectKeys
    .map((key) => effects[key])
    .filter((value): value is string => Boolean(value?.trim()));
  const translations = await translateUniqueTexts(stringsToTranslate, language);

  return effectKeys.reduce(
    (nextEffects, key) => ({
      ...nextEffects,
      [key]: effects[key] ? translations.get(effects[key] || "") || effects[key] : effects[key]
    }),
    { ...effects }
  );
}

function titleizeDetailKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
  actionRow: { flexDirection: "row", gap: spacing.sm },
  clearBtn: { minWidth: 104, height: 32, borderRadius: 5, borderWidth: 1, borderColor: "#111", backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  clearText: { fontFamily: "serif", fontWeight: "900", color: "#111", fontSize: 15 },
  submitBtn: { height: 32, borderRadius: 5, borderWidth: 1, borderColor: "#111", backgroundColor: "#ffcf28", alignItems: "center", justifyContent: "center" },
  submitBtnFlex: { flex: 1 },
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
  detailButton: { minHeight: 68, borderRadius: 10, borderWidth: 1.5, borderColor: "#32b248", backgroundColor: "#f8fff6", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, shadowColor: "#0d5a1d", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.24, shadowRadius: 5, elevation: 5 },
  detailButtonCopy: { flex: 1 },
  detailButtonTitle: { color: "#0b5719", fontSize: 15, lineHeight: 19, fontWeight: "900" },
  detailButtonSubtitle: { color: "#36543a", fontSize: 12, lineHeight: 16, fontWeight: "800", marginTop: 3 },
  detailButtonArrow: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#1d8d31", alignItems: "center", justifyContent: "center", shadowColor: "#0d5a1d", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.24, shadowRadius: 3, elevation: 3 },
  repetitionSection: { borderRadius: 8, borderWidth: 1.5, borderColor: "#b5d7ff", backgroundColor: "#eaf5ff", padding: spacing.md, gap: spacing.md, shadowColor: "#0b3a78", shadowOpacity: 0.14, shadowRadius: 5, elevation: 3 },
  repetitionHero: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  repetitionHeroCopy: { flex: 1 },
  repetitionKicker: { color: "#1167df", fontSize: 15, lineHeight: 20, fontWeight: "900" },
  repetitionTitle: { color: "#061b4f", fontSize: 24, lineHeight: 30, fontWeight: "900", marginTop: 3 },
  repetitionGrid: { width: 132, height: 132, flexDirection: "row", flexWrap: "wrap", borderRadius: 8, backgroundColor: "#fff", padding: 5, gap: 3, shadowColor: "#0b3a78", shadowOpacity: 0.2, shadowRadius: 6, elevation: 5 },
  repetitionGridCell: { width: 38, height: 38, borderRadius: 5, borderWidth: 1, borderColor: "#edf2ff", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", paddingVertical: 2 },
  repetitionGridCellActive: { backgroundColor: "#d8ecff" },
  repetitionGridCellMissing: { backgroundColor: "#f1f1f1" },
  repetitionGridNumber: { color: "#061b4f", fontSize: 18, lineHeight: 22, fontWeight: "900", textAlign: "center", paddingHorizontal: 2 },
  repetitionGridNumberMissing: { color: "#777", fontSize: 16, lineHeight: 18 },
  repetitionGridMissingLabel: { color: "#777", fontSize: 7, lineHeight: 9, fontWeight: "900", textAlign: "center" },
  repetitionGridNumberMany: { color: "#d71920" },
  repetitionCards: { gap: spacing.sm },
  repetitionCard: { minHeight: 104, borderRadius: 8, backgroundColor: "#fff", padding: spacing.md, flexDirection: "row", alignItems: "flex-start", gap: spacing.md, shadowColor: "#0b3a78", shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  repetitionIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#e1f0ff", alignItems: "center", justifyContent: "center" },
  repetitionCopy: { flex: 1 },
  repetitionCardTitle: { color: "#061b4f", fontSize: 18, lineHeight: 23, fontWeight: "900" },
  repetitionTitleMissing: { color: "#777" },
  repetitionTitleOnce: { color: "#111" },
  repetitionTitleTwice: { color: "#d9a300" },
  repetitionTitleMany: { color: "#d71920" },
  repetitionCardText: { color: "#111", fontSize: 13, lineHeight: 20, marginTop: 5 },
  repetitionNoteRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "center", gap: spacing.sm, paddingHorizontal: spacing.sm },
  repetitionNote: { flex: 1, color: "#111", fontSize: 12, lineHeight: 18, fontWeight: "700" },
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
  effectsBox: { borderRadius: 8, backgroundColor: "#fffde5", padding: spacing.sm, gap: spacing.sm, shadowColor: "#0d3440", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 6, elevation: 4 },
  combinationBadge: { alignSelf: "flex-start", minHeight: 31, borderRadius: 5, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", overflow: "hidden", shadowColor: "#0d3440", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 2 },
  combinationLabel: { paddingHorizontal: 8, paddingVertical: 3, color: "#111", fontSize: 12, lineHeight: 18, fontWeight: "900" },
  combinationValue: { minHeight: 31, paddingHorizontal: 10, paddingVertical: 3, color: "#145c24", backgroundColor: "#bff2c6", textAlignVertical: "center", fontSize: 14, lineHeight: 20, fontWeight: "900" },
  effectPanels: { gap: spacing.sm },
  effectPanel: { minHeight: 100, flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, borderRadius: 8, backgroundColor: "#fff", padding: spacing.md, shadowColor: "#0b3a78", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 5, elevation: 3 },
  effectIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  effectCopy: { flex: 1 },
  effectTitle: { fontSize: 22, lineHeight: 32, fontWeight: "900" },
  effectText: { color: "#111", fontSize: 15, lineHeight: 24, paddingVertical: 2 },
  yearInputs: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  yearInput: { flex: 1, height: 36, borderWidth: 1, borderColor: "#111", borderRadius: 5, backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 0, color: "#111", fontSize: 13, lineHeight: 18, textAlignVertical: "center" },
  smallBtn: { height: 36, paddingHorizontal: spacing.md, borderRadius: 5, borderWidth: 1, borderColor: "#111", backgroundColor: "#ffcf28", alignItems: "center", justifyContent: "center" },
  smallBtnText: { color: "#111", fontWeight: "900" },
  matrixTable: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#111", backgroundColor: "#fff" },
  matrixTopHeader: { flexDirection: "row", backgroundColor: "#ffd95d" },
  matrixMonthHeader: { flexDirection: "row" },
  matrixRow: { flexDirection: "row" },
  matrixHeadCell: { width: 48, minHeight: 34, textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", fontSize: 12, fontWeight: "900", color: "#111" },
  matrixTallHead: { minHeight: 68, borderBottomWidth: 0 },
  matrixHeadSpacer: { minHeight: 34, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", backgroundColor: "#ffd95d" },
  matrixMonthGroup: { width: 576, minHeight: 34, textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", fontFamily: "serif", fontSize: 14, fontWeight: "900", color: "#111" },
  matrixCell: { width: 48, minHeight: 34, textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", fontSize: 15, fontWeight: "800", color: "#111" },
  matrixYear: { width: 54 },
  matrixPersonal: { width: 86 },
  matrixPersonalValueCell: { alignItems: "center", justifyContent: "center" },
  matrixPersonalYearText: { fontSize: 15, lineHeight: 20, fontWeight: "900", textAlign: "center" },
  matrixPersonalYearFirst: { color: "#d71920", fontWeight: "900" },
  matrixPersonalYearSlash: { color: "#111", fontWeight: "900" },
  matrixPersonalYearLast: { color: "#148f36", fontWeight: "900" },
  readingBox: { borderWidth: 2, borderColor: "#0d3440", backgroundColor: "#fffde5", padding: spacing.sm },
  readingTitle: { fontFamily: "serif", color: "#111", fontSize: 25, lineHeight: 30, fontWeight: "900" },
  readingText: { fontFamily: "serif", color: "#111", fontSize: 16, lineHeight: 21 },
  detailContent: { alignSelf: "center", width: "100%", maxWidth: 420, backgroundColor: "#ffffc9", padding: spacing.lg, paddingBottom: 104, gap: spacing.lg },
  detailContainer: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, backgroundColor: "#ffffc9" },
  detailTabs: { flexDirection: "row", borderWidth: 1, borderColor: "#34a853", borderRadius: 7, backgroundColor: "#fff", padding: 3, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 3, elevation: 2 },
  detailTab: { flex: 1, minHeight: 36, borderRadius: 5, alignItems: "center", justifyContent: "center" },
  detailTabActive: { backgroundColor: "#bff2c6" },
  detailTabText: { color: "#424242", fontSize: 13, fontWeight: "900" },
  detailTabTextActive: { color: "#145c24" },
  detailStack: { gap: spacing.lg },
  detailSummary: { borderRadius: 7, borderWidth: 1, borderColor: "#39a853", backgroundColor: "#fff", padding: spacing.md, shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 3, elevation: 2 },
  detailSummaryNumber: { color: "#145c24", fontSize: 18, lineHeight: 28, fontWeight: "900" },
  detailSummaryText: { color: "#111", fontSize: 13, lineHeight: 21, fontWeight: "700", marginTop: 2 },
  detailCard: { borderWidth: 1, borderRadius:7, borderColor: "#39d34a", backgroundColor: "#fff", paddingHorizontal: 8, paddingTop: 2, paddingBottom: 9 },
  detailCardTitleWrap: {   marginBottom: 5, borderWidth: 1, borderColor: "#39d34a", borderRadius: 5, backgroundColor: "#c9f6c6",  paddingVertical: 6,marginTop:6 },
  detailCardTitle: { color: "#075416", fontSize: 16, lineHeight: 24, fontWeight: "900", textAlign: "center" },
  detailBullets: { gap: 2 },
  detailBulletRow: { flexDirection: "row", alignItems: "flex-start" },
  detailBulletDot: { width: 14, color: "#111", fontSize: 17, lineHeight: 18, fontWeight: "900" },
  detailBulletLead: { color: "#075416", fontWeight: "900" },
  detailBulletText: { flex: 1, color: "#111", fontSize: 12, lineHeight: 20, fontWeight: "700" }
});
