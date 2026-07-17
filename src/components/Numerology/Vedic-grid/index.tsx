import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { getVedicGrid, VedicGridResponse } from "@/services/numerology.service";

import { GridIntro, NumberCard } from "@/components/Numerology/Lushu-grid/Common";
import { LoShuGrid } from "@/components/Numerology/Lushu-grid/LoShuGrid";
import { styles } from "@/components/Numerology/Lushu-grid/styles";

export function VedicGridScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ fullName?: string; dob?: string; gender?: string }>();
  const fullName = String(params.fullName || "");
  const dob = String(params.dob || "");
  const gender = String(params.gender || "Male");
  const payload = useMemo(() => ({ dob, fullName, gender }), [dob, fullName, gender]);
  const [vedicGrid, setVedicGrid] = useState<VedicGridResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadVedicGrid() {
      try {
        setLoading(true);
        setError(null);
        const response = await getVedicGrid(payload);
        if (mounted) setVedicGrid(response);
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Unable to load vedic grid"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadVedicGrid();
    return () => {
      mounted = false;
    };
  }, [payload]);

  if (loading) return <LoadingState label="Loading vedic grid" />;
  if (error && !vedicGrid) return <ErrorState message={error} onRetry={() => router.replace("/astrologer/numerology")} />;

  return (
    <SafeAreaView style={[styles.safe, vedicStyles.screenBackground]}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
        <Text variant="headlineSmall" style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{t("Numerology")}</Text>
        <LanguageSelector />
      </View>
      <ScrollView
        style={[styles.scroll, vedicStyles.screenBackground]}
        contentContainerStyle={[styles.resultContent, vedicStyles.contentBackground]}
        showsVerticalScrollIndicator={false}
      >
        <GridIntro
          title={t("Master Vedic Grid")}
          description={t("Vedic number placement showing core numbers, zodiac influence, and active grid energy.")}
        />
        <LoShuGrid grid={vedicGrid?.grid} />
        <View style={styles.cardGrid}>
          <NumberCard label={t("Personality Number")} value={vedicGrid?.driverNumber} note={t("Inner Nature")} />
          <NumberCard label={t("Destiny Number")} value={vedicGrid?.destinyNumber} note={t("Life Path")} />
          <NumberCard label={t("Kua Number")} value={vedicGrid?.kuaNumber} note={t("Personal Energy")} />
          <NumberCard label={t("Name Number")} value={vedicGrid?.nameNumber} note={t("Compound")} />
          <NumberCard label={t("Running Age")} value={vedicGrid?.runningAge} note={t("Years")} />
          <NumberCard label={t("Zodiac")} value={vedicGrid?.zodiacNumber} note={vedicGrid?.zodiacSign || t("Zodiac Sign")} />
        </View>
        {error ? <Text style={styles.validation}>{error}</Text> : null}
      </ScrollView>
      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}

const vedicStyles = StyleSheet.create({
  screenBackground: { backgroundColor: "#ffffc9" },
  contentBackground: { backgroundColor: "#ffffc9" }
});
