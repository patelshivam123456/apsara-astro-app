import { useMemo, useState } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Button, Text } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { setOnboardingComplete } from "@/services/storage";

const slides = [
  {
    title: "Accurate Predictions & Sacred Rituals",
    description: "Connect with trusted Astrologers and Numerologists.",
    button: "Next"
  },
  {
    title: "Talk to Verified Experts",
    description: "Chat and Call certified Astrologers anytime.",
    button: "Next"
  },
  {
    title: "Begin Your Spiritual Journey",
    description: "Daily predictions, remedies, horoscope and more.",
    button: "Get Started"
  }
];

export function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;
  const progress = useMemo(() => `${index + 1}/${slides.length}`, [index]);

  const complete = async () => {
    await setOnboardingComplete();
    router.replace({ pathname: "/(auth)/login", params: { mode: "astrologer" } });
  };

  const next = () => {
    if (isLast) complete();
    else setIndex((current) => current + 1);
  };

  return (
    <ImageBackground source={require("@/assets/Astro_Banner.jpg")} resizeMode="cover" style={styles.bg}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        <View style={styles.brand}>
          <Text variant="labelLarge" style={styles.brandText}>ApsaraAstro</Text>
          <Text variant="bodySmall" style={styles.progress}>{progress}</Text>
        </View>
        <View style={styles.copy}>
          <Text variant="displaySmall" style={styles.title}>{slide.title}</Text>
          <Text variant="titleMedium" style={styles.description}>{slide.description}</Text>
        </View>
        <View style={styles.dots}>
          {slides.map((item, dotIndex) => (
            <View key={item.title} style={[styles.dot, dotIndex === index && styles.activeDot]} />
          ))}
        </View>
        <View style={styles.actions}>
          {!isLast ? <Button mode="text" textColor={colors.surface} onPress={complete}>Skip</Button> : <View />}
          <Button mode="contained" buttonColor={colors.lime} textColor={colors.ink} onPress={next}>{slide.button}</Button>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(33, 23, 4, 0.56)" },
  content: { flex: 1, padding: spacing.xl, justifyContent: "space-between" },
  brand: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandText: { color: colors.lime, fontWeight: "800" },
  progress: { color: colors.surface },
  copy: { gap: spacing.md, paddingBottom: spacing.xl },
  title: { color: colors.surface, fontWeight: "800" },
  description: { color: "#fff7e8", lineHeight: 26 },
  dots: { flexDirection: "row", gap: spacing.sm },
  dot: { width: 24, height: 5, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.45)" },
  activeDot: { width: 42, backgroundColor: colors.lime },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }
});
