import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { useTranslation } from "@/context/LanguageContext";
import { PersonalityDestinyType } from "@/services/numerology.service";

import { PersonalityDestinyDetails } from "./PersonalityDestinyDetails";
import { styles } from "./styles";
import { usePersonalityDestinyReport } from "./usePersonalityDestinyReport";

export function PersonalityDestinyScreen() {
  const { language, t } = useTranslation();
  const params = useLocalSearchParams<{ personalityNumber?: string; destinyNumber?: string; tab?: PersonalityDestinyType }>();
  const [activeTab, setActiveTab] = useState<PersonalityDestinyType>(params.tab === "DESTINY" ? "DESTINY" : "PERSONALITY");
  const personalityNumber = Number(params.personalityNumber);
  const destinyNumber = Number(params.destinyNumber);
  const activeNumber = activeTab === "PERSONALITY" ? personalityNumber : destinyNumber;
  const { currentDetails, detailsLoading, error, retry, translating } = usePersonalityDestinyReport({
    activeNumber,
    activeTab,
    language
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
        <Text variant="headlineSmall" style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{t("Numerology")}</Text>
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
              <Text style={[styles.detailTabText, activeTab === tab && styles.detailTabTextActive]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
                {tab === "PERSONALITY" ? t("Personality") : t("Destiny")}
              </Text>
            </Pressable>
          ))}
        </View>
        </View>
<ScrollView style={styles.scroll} contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        {detailsLoading ? <LoadingState label={translating ? `Translating ${activeTab.toLowerCase()} details` : `Loading ${activeTab.toLowerCase()} details`} /> : null}
        {error && !detailsLoading ? <ErrorState message={error} onRetry={retry} /> : null}
        {!detailsLoading && !error && currentDetails ? (
          <PersonalityDestinyDetails type={activeTab} numberValue={activeNumber} details={currentDetails} />
        ) : null}
      </ScrollView>
      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}
