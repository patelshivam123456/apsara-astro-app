import { Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { useTranslation } from "@/context/LanguageContext";

import { GridIntro, NumberCard, SectionLabel } from "./Common";
import { Calculation } from "./constants";
import { LoShuGrid } from "./LoShuGrid";
import { LoShuRepetitionEffectsSection } from "./LoShuRepetitionEffectsSection";
import { MatrixTable } from "./MatrixTable";
import { PersonalYearReading } from "./PersonalYearReading";
import { RelationTable } from "./RelationTable";
import { SectorWiseEffects } from "./SectorWiseEffects";
import { styles } from "./styles";
import { useNumerologyReport } from "./useNumerologyReport";

export function NumerologyResultScreen() {
  const { language, t } = useTranslation();
  const params = useLocalSearchParams<{ fullName?: string; dob?: string; gender?: string; calculation?: Calculation }>();
  const fullName = String(params.fullName || "");
  const dob = String(params.dob || "");
  const gender = String(params.gender || "Male");
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
        <Text variant="headlineSmall" style={styles.headerTitle}>{t("Numerology")}</Text>
        <LanguageSelector />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
        
        <GridIntro
          title={t("Lo Shu Grid")}
          description={t("Birth-date numbers arranged to reveal strengths, missing energies, and life patterns.")}
        />
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
