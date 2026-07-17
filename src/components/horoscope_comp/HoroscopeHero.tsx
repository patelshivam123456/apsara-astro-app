import { Pressable, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native-paper";

import { useTranslation } from "@/context/LanguageContext";
import { HoroscopeSign } from "@/services/horoscope.service";
import { horoscopeSigns } from "./constants";
import { horoscopeStyles as styles } from "./styles";

type Props = {
  selectedPeriodLabel: string;
  selectedSign: HoroscopeSign;
  onSelectSign: (sign: HoroscopeSign) => void;
};

export function HoroscopeHero({ selectedPeriodLabel, selectedSign, onSelectSign }: Props) {
  const { t } = useTranslation();
  const selectedSignLabel = horoscopeSigns.find((sign) => sign.key === selectedSign)?.label || "Virgo";

  return (
    <LinearGradient colors={["#3b2d0f", "#14160c", "#030503"]} style={styles.hero}>
      <View style={styles.signRail}>
        {horoscopeSigns.map((sign) => {
          const selected = sign.key === selectedSign;
          return (
            <Pressable key={sign.key} style={styles.signButton} onPress={() => onSelectSign(sign.key)}>
              <View style={[styles.signIconShell, selected && styles.signIconShellActive]}>
                <View style={[styles.signIcon, { backgroundColor: sign.color }]}>
                  <MaterialCommunityIcons name={sign.icon} color="#fff" size={27} />
                </View>
              </View>
              <Text style={[styles.signLabel, selected && styles.signLabelActive]}>{t(sign.label)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.heroCopy}>
        <Text style={styles.heroTitle}>
          {t(selectedPeriodLabel.split(" ")[0])} <Text style={styles.heroTitleSoft}>{t("Horoscope")}</Text>
        </Text>
        <Text style={styles.heroSubtitle}>{t(selectedSignLabel)}</Text>
      </View>
    </LinearGradient>
  );
}
