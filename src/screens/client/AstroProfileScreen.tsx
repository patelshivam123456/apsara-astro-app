import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button, Menu, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { LanguageSelector } from "@/components/LanguageSelector";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { getBasicAstroDetails, toBasicAstroBirthPayload } from "@/services/astroProfile.service";
import { GeoLocationPlace, getGeolocationPlaces } from "@/services/kundali.service";
import { useAstroProfileStore } from "@/store/astroProfile.store";
import { getApiLanguageName } from "@/utils/language";

const genders = ["male", "female", "other"] as const;

type FormState = {
  fullName: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  min: string;
  sec: string;
  gender: string;
  place: string;
};

const initialForm: FormState = {
  fullName: "",
  day: "",
  month: "",
  year: "",
  hour: "",
  min: "",
  sec: "0",
  gender: "male",
  place: ""
};

export function AstroProfileScreen() {
  const { language, t } = useTranslation();
  const setResult = useAstroProfileStore((state) => state.setResult);
  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedPlace, setSelectedPlace] = useState<GeoLocationPlace | null>(null);
  const [places, setPlaces] = useState<GeoLocationPlace[]>([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [genderMenuOpen, setGenderMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const errors = useMemo(() => validate(form, selectedPlace), [form, selectedPlace]);
  const canSubmit = Object.keys(errors).length === 0 && !submitting;

  useEffect(() => {
    const query = form.place.trim();

    if (selectedPlace?.placeName === query) {
      setPlaces([]);
      setPlaceError("");
      return undefined;
    }

    setSelectedPlace((current) => current ? null : current);
    setPlaceError("");

    if (query.length < 3) {
      setPlaces([]);
      return undefined;
    }

    const timeout = setTimeout(async () => {
      try {
        setPlaceLoading(true);
        const response = await getGeolocationPlaces(query);
        setPlaces(response);
      } catch (error) {
        setPlaceError(getApiErrorMessage(error, "Unable to load place suggestions"));
      } finally {
        setPlaceLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [form.place, selectedPlace?.placeName]);

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const selectPlace = (place: GeoLocationPlace) => {
    setSelectedPlace(place);
    setForm((current) => ({ ...current, place: place.placeName }));
    setPlaces([]);
  };

  const submit = async () => {
    setSubmitted(true);
    setSubmitError("");

    if (!canSubmit || !selectedPlace) return;

    try {
      setSubmitting(true);
      const payload = {
        birth: toBasicAstroBirthPayload(form, selectedPlace),
        language: getApiLanguageName(language),
        languageCode: language
      };
      const response = await getBasicAstroDetails(payload);
      setResult(response, payload);
      router.push("/apsara-astro-profile-result");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to load Apsara Astro Profile"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact style={styles.headerAction} onPress={() => router.back()}>
          {t("Back")}
        </Button>
        <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
          {t("Apsara Astro Profile")}
        </Text>
        <LanguageSelector />
      </View>

      <KeyboardAwareScrollView
        style={styles.formScroller}
        contentContainerStyle={styles.content}
        enableOnAndroid
        extraScrollHeight={30}
        extraHeight={140}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text variant="headlineSmall" style={styles.introTitle} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Create Apsara Astro Profile")}</Text>
          <Text style={styles.muted}>{t("Enter birth details and select a place from suggestions.")}</Text>
        </View>

        <TextInput label={t("Full Name")} value={form.fullName} onChangeText={(value) => update("fullName", value)} mode="outlined" error={submitted && Boolean(errors.fullName)} />
        <FieldError visible={submitted} message={errors.fullName} />

        <View style={styles.row}>
          <SmallInput label="Day" value={form.day} onChangeText={(value) => update("day", digits(value, 2))} error={submitted && Boolean(errors.day)} />
          <SmallInput label="Month" value={form.month} onChangeText={(value) => update("month", digits(value, 2))} error={submitted && Boolean(errors.month)} />
          <SmallInput label="Year" value={form.year} onChangeText={(value) => update("year", digits(value, 4))} error={submitted && Boolean(errors.year)} />
        </View>
        <FieldError visible={submitted} message={errors.day || errors.month || errors.year} />

        <View style={styles.row}>
          <SmallInput label="Hour" value={form.hour} onChangeText={(value) => update("hour", digits(value, 2))} error={submitted && Boolean(errors.hour)} />
          <SmallInput label="Min" value={form.min} onChangeText={(value) => update("min", digits(value, 2))} error={submitted && Boolean(errors.min)} />
          <SmallInput label="Sec" value={form.sec} onChangeText={(value) => update("sec", digits(value, 2))} error={submitted && Boolean(errors.sec)} />
        </View>
        <FieldError visible={submitted} message={errors.hour || errors.min || errors.sec} />

        <Menu
          visible={genderMenuOpen}
          onDismiss={() => setGenderMenuOpen(false)}
          anchor={
            <Pressable style={styles.selectBox} onPress={() => setGenderMenuOpen(true)}>
              <Text style={styles.selectLabel}>{t("Gender")}</Text>
              <Text style={styles.selectValue}>{t(form.gender)}</Text>
              <MaterialCommunityIcons name="chevron-down" size={22} color={colors.cocoa} />
            </Pressable>
          }
        >
          {genders.map((gender) => (
            <Menu.Item key={gender} title={t(gender)} onPress={() => {
              update("gender", gender);
              setGenderMenuOpen(false);
            }} />
          ))}
        </Menu>

        <TextInput
          label={t("Birth Place")}
          value={form.place}
          onChangeText={(value) => update("place", value)}
          mode="outlined"
          error={submitted && Boolean(errors.place)}
          right={placeLoading ? <TextInput.Icon icon="loading" /> : undefined}
        />
        <FieldError visible={submitted} message={errors.place} />
        {placeError ? <Text style={styles.errorText}>{t(placeError)}</Text> : null}
        {places.length ? (
          <View style={styles.suggestions}>
            {places.map((place) => (
              <Pressable key={`${place.placeName}-${place.latitude}-${place.longitude}`} style={styles.suggestionItem} onPress={() => selectPlace(place)}>
                <Text style={styles.suggestionTitle}>{place.placeName}</Text>
                <Text style={styles.muted}>{place.timezoneId || place.countryName}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {submitError ? <Text style={styles.errorText}>{t(submitError)}</Text> : null}
        <Button mode="contained" loading={submitting} disabled={!canSubmit && submitted} onPress={submit}>
          {t("Submit Profile")}
        </Button>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function SmallInput({ label, value, onChangeText, error }: { label: string; value: string; onChangeText: (value: string) => void; error?: boolean }) {
  const { t } = useTranslation();
  return <TextInput style={styles.smallInput} label={t(label)} value={value} onChangeText={onChangeText} mode="outlined" keyboardType="number-pad" error={error} />;
}

function FieldError({ visible, message }: { visible: boolean; message?: string }) {
  const { t } = useTranslation();
  if (!visible || !message) return null;
  return <Text style={styles.fieldError}>{t(message)}</Text>;
}

function digits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function validate(form: FormState, selectedPlace: GeoLocationPlace | null) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.fullName.trim()) errors.fullName = "Full name is required";
  if (!inRange(form.day, 1, 31)) errors.day = "Enter a valid day";
  if (!inRange(form.month, 1, 12)) errors.month = "Enter a valid month";
  if (!inRange(form.year, 1900, new Date().getFullYear())) errors.year = "Enter a valid year";
  if (!inRange(form.hour, 0, 23)) errors.hour = "Enter a valid hour";
  if (!inRange(form.min, 0, 59)) errors.min = "Enter a valid minute";
  if (form.sec && !inRange(form.sec, 0, 59)) errors.sec = "Enter a valid second";
  if (!form.place.trim() || !selectedPlace) errors.place = "Select a birth place from suggestions";
  return errors;
}

function inRange(value: string, min: number, max: number) {
  if (!value.trim()) return false;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { minHeight: 56, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  headerAction: { width: 86, marginLeft: -8 },
  headerTitle: { flex: 1, color: colors.ink, fontWeight: "800", textAlign: "center" },
  formScroller: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  intro: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.xs },
  introTitle: { color: colors.ink, fontWeight: "900", lineHeight: 30 },
  muted: { color: colors.cocoa },
  row: { flexDirection: "row", gap: spacing.sm },
  smallInput: { flex: 1 },
  selectBox: { minHeight: 58, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  selectLabel: { color: colors.cocoa, fontSize: 12, fontWeight: "800" },
  selectValue: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: "900", textTransform: "capitalize" },
  suggestions: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" },
  suggestionItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 2 },
  suggestionTitle: { color: colors.ink, fontWeight: "800" },
  fieldError: { marginTop: -spacing.sm, color: colors.danger, fontSize: 12, fontWeight: "700" },
  errorText: { color: colors.danger, fontWeight: "700" }
});
