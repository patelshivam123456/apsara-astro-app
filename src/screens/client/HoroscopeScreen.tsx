import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorState, LoadingState } from "@/components/StateViews";
import { horoscopePeriods } from "@/components/horoscope_comp/constants";
import {
  getAstrologerMeta,
  getAstrologerPrediction,
  getDivineMeta,
  getDivinePrediction,
  hasPredictionEntries
} from "@/components/horoscope_comp/helpers";
import { HoroscopeHeader } from "@/components/horoscope_comp/HoroscopeHeader";
import { HoroscopeHero } from "@/components/horoscope_comp/HoroscopeHero";
import { HoroscopePeriodPicker } from "@/components/horoscope_comp/HoroscopePeriodPicker";
import { HoroscopeTabs } from "@/components/horoscope_comp/HoroscopeTabs";
import { PredictionPanel } from "@/components/horoscope_comp/PredictionPanel";
import { horoscopeStyles as styles } from "@/components/horoscope_comp/styles";
import { ActiveHoroscopeTab } from "@/components/horoscope_comp/types";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { getHoroscope, HoroscopePeriod, HoroscopeSign } from "@/services/horoscope.service";

export function HoroscopeScreen() {
  const { language, t } = useTranslation();
  const [selectedSign, setSelectedSign] = useState<HoroscopeSign>("virgo");
  const [selectedPeriod, setSelectedPeriod] = useState<HoroscopePeriod>("daily");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveHoroscopeTab>("astrologer");

  const handleSelectSign = useCallback((sign: HoroscopeSign) => {
    setSelectedSign(sign);
  }, []);

  const handleSelectPeriod = useCallback((period: HoroscopePeriod) => {
    setSelectedPeriod(period);
    setPeriodOpen(false);
  }, []);

  const selectedPeriodLabel = useMemo(
    () => horoscopePeriods.find((period) => period.key === selectedPeriod)?.label || "Daily horoscope",
    [selectedPeriod]
  );

  const horoscope = useQuery({
    queryKey: ["horoscope", selectedSign, selectedPeriod, language],
    queryFn: () => getHoroscope(selectedSign, selectedPeriod, language),
    staleTime: 0
  });

  const astrology = horoscope.data?.astrology;
  const divine = horoscope.data?.divine?.data;
  const astrologerPrediction = getAstrologerPrediction(astrology);
  const divinePrediction = getDivinePrediction(divine, selectedPeriod);
  const hasAstrologer = hasPredictionEntries(astrologerPrediction);
  const hasDivine = hasPredictionEntries(divinePrediction);

  useEffect(() => {
    if (horoscope.isLoading) return;
    if (activeTab === "astrologer" && !hasAstrologer && hasDivine) {
      setActiveTab("divine");
    }
    if (activeTab === "divine" && !hasDivine && hasAstrologer) {
      setActiveTab("astrologer");
    }
  }, [activeTab, hasAstrologer, hasDivine, horoscope.isLoading]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <HoroscopeHeader />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HoroscopePeriodPicker
          open={periodOpen}
          selectedPeriodLabel={selectedPeriodLabel}
          onOpen={() => setPeriodOpen(true)}
          onDismiss={() => setPeriodOpen(false)}
          onSelectPeriod={handleSelectPeriod}
        />

        <HoroscopeHero
          selectedPeriodLabel={selectedPeriodLabel}
          selectedSign={selectedSign}
          onSelectSign={handleSelectSign}
        />

        <HoroscopeTabs
          activeTab={activeTab}
          hasAstrologer={hasAstrologer}
          hasDivine={hasDivine}
          onChangeTab={setActiveTab}
        />

        {horoscope.isLoading ? (
          <LoadingState label="Loading horoscope" />
        ) : horoscope.isError ? (
          <ErrorState message={getApiErrorMessage(horoscope.error, "Unable to load horoscope")} onRetry={() => horoscope.refetch()} />
        ) : activeTab === "astrologer" ? (
          <PredictionPanel
            title={`${t("Astrologer")} ${t("Reading")}`}
            meta={getAstrologerMeta(astrology)}
            prediction={astrologerPrediction}
          />
        ) : (
          <PredictionPanel
            title={`${t("Divine")} ${t("Reading")}`}
            meta={getDivineMeta(divine)}
            prediction={divinePrediction}
            colorCodes={divine?.special?.lucky_color_codes}
            percentages={divine?.special?.horoscope_percentage}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
