import { useEffect, useState } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";

export { NumerologyResultScreen, PersonalityDestinyScreen } from "@/components/Numerology/Lushu-grid";
export { VedicGridScreen } from "@/components/Numerology/Vedic-grid";

type Gender = "Male" | "Female" | "Other";
type Calculation = "lo-shu-grid" | "vedic-grid" | "pythagoras-grid" | "name-frequency" | "daily-numeroscope";

const calculationOptions: { label: string; value: Calculation }[] = [
  { label: "Lo Shu Grid", value: "lo-shu-grid" },
  { label: "Vedic Grid", value: "vedic-grid" },
  { label: "Pythagoras Grid", value: "pythagoras-grid" },
  { label: "Name Frequency", value: "name-frequency" },
  { label: "Daily Numeroscope", value: "daily-numeroscope" }
];
const minimumDobDate = new Date(1900, 0, 1);

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
    (calculation === "lo-shu-grid" || calculation === "vedic-grid");

  const submit = () => {
    setSubmitted(true);
    setCalculationOpen(false);
    if (!canSubmit) return;
    router.push({
      pathname: calculation === "vedic-grid" ? "/astrologer/vedic-grid" : "/astrologer/numerology-result",
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
              {calculation !== "lo-shu-grid" && calculation !== "vedic-grid" ? t("Please select Lo Shu Grid or Vedic Grid calculation.") : t("Enter full name, DOB, and gender.")}
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

function FieldIcon({ icon }: { icon: keyof typeof MaterialCommunityIcons.glyphMap }) {
  return (
    <View style={styles.fieldIcon}>
      <MaterialCommunityIcons name={icon} size={24} color="#111" />
    </View>
  );
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
  scroll: { flex: 1 },
  content: { minHeight: "100%", alignSelf: "center", width: "100%", maxWidth: 420, backgroundColor: "#ffffc9", padding: spacing.lg, paddingBottom: 104 },
  panel: { marginTop: spacing.lg, borderRadius: 12, backgroundColor: "#fffdf0", padding: spacing.lg, gap: spacing.lg, shadowColor: "#0d3440", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.16, shadowRadius: 8, elevation: 5 },
  formStack: { minHeight: 50, flexDirection: "row", alignItems: "center", borderRadius: 10, backgroundColor: "#fff", paddingHorizontal: 7, shadowColor: "#0d3440", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
  fieldIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#e8f8e8", alignItems: "center", justifyContent: "center", marginRight: spacing.sm },
  input: { flex: 1, minHeight: 46, paddingVertical: 8, paddingHorizontal: 0, color: "#111", fontFamily: "serif", fontSize: 16, textAlignVertical: "center" },
  dateSelect: { flex: 1, minHeight: 46, justifyContent: "center", paddingRight: spacing.sm },
  dateSelectText: { color: "#111", fontFamily: "serif", fontSize: 16, lineHeight: 22 },
  placeholderText: { color: "#9c9c9c" },
  genderRow: { flexDirection: "row", gap: spacing.sm, padding: 4, borderRadius: 11, backgroundColor: "#fff", shadowColor: "#0d3440", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  genderBtn: { flex: 1, minHeight: 42, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#f8f8f8", paddingHorizontal: 4, paddingVertical: 3 },
  genderBtnActive: { backgroundColor: "#c7efc8", shadowColor: "#1d8d31", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 3, elevation: 2 },
  genderText: { color: "#111", fontSize: 13, lineHeight: 16, textAlign: "center", fontWeight: "700" },
  genderTextActive: { color: "#145c24", fontWeight: "900" },
  calculationSelect: { flex: 1 },
  calculationTrigger: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: spacing.sm },
  calculationValue: { fontFamily: "serif", fontSize: 16, color: "#111", fontWeight: "700" },
  calculationMenu: { marginTop: 4, marginRight: spacing.sm, marginBottom: 7, borderRadius: 8, backgroundColor: "#f8fff6", overflow: "hidden" },
  calculationOption: { minHeight: 38, justifyContent: "center", paddingHorizontal: spacing.sm, borderTopWidth: 1, borderTopColor: "#e1f1df" },
  calculationOptionActive: { backgroundColor: "#c7efc8" },
  calculationOptionText: { fontFamily: "serif", fontSize: 15, color: "#111" },
  calculationOptionTextActive: { color: "#145c24", fontWeight: "900" },
  validation: { color: colors.danger, fontSize: 12, fontWeight: "800", lineHeight: 17, paddingHorizontal: 2 },
  actionRow: { flexDirection: "row", gap: spacing.sm },
  clearBtn: { minWidth: 104, minHeight: 44, borderRadius: 10, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 3, shadowColor: "#0d3440", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  clearText: { fontFamily: "serif", fontWeight: "900", color: "#111", fontSize: 15, lineHeight: 18, textAlign: "center" },
  submitBtn: { minHeight: 44, borderRadius: 10, backgroundColor: "#ffcf28", alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm, paddingVertical: 3, shadowColor: "#8a6500", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 5, elevation: 4 },
  submitBtnFlex: { flex: 1 },
  submitText: { fontFamily: "serif", fontWeight: "900", color: "#111", fontSize: 17, lineHeight: 20, textAlign: "center" }
});
