import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { LanguageSelector } from "@/components/LanguageSelector";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import {
  GeoLocationPlace,
  getGeolocationPlaces,
  getKundaliBasicDetails,
  KundaliBasicPayload
} from "@/services/kundali.service";
import { useKundaliStore } from "@/store/kundali.store";

const genders = ["male", "female"] as const;
const indiaTimeZone = "GMT +05:30";
const indiaTimeZoneOffset = "5.5";
const minimumBirthDate = new Date(1900, 0, 1);

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
  sec: "00",
  gender: "male",
  place: ""
};

export function KundaliPdfScreen() {
  const { language, t } = useTranslation();
  const setResult = useKundaliStore((state) => state.setResult);
  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedPlace, setSelectedPlace] = useState<GeoLocationPlace | null>(null);
  const [places, setPlaces] = useState<GeoLocationPlace[]>([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const errors = useMemo(() => validate(form, selectedPlace), [form, selectedPlace]);
  const canSubmit = Object.keys(errors).length === 0 && !submitting;

  useEffect(() => {
    const query = form.place.trim();
    if (selectedPlace?.placeName === query) return;

    if (query.length < 3) return;

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

  const updatePlace = (value: string) => {
    setSelectedPlace(null);
    setPlaces([]);
    setPlaceError("");
    update("place", value);
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

    const payload: KundaliBasicPayload = {
      fullName: form.fullName.trim(),
      day: normalizeNumberField(form.day),
      month: normalizeNumberField(form.month),
      year: form.year.trim(),
      hour: normalizeNumberField(form.hour),
      min: normalizeNumberField(form.min),
      sec: normalizeNumberField(form.sec || "00"),
      gender: form.gender,
      place: selectedPlace.placeName,
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
      timeZone: getPayloadTimeZone(),
      language
    };

    try {
      setSubmitting(true);
      const response = await getKundaliBasicDetails(payload);
      setResult(response, payload);
      router.push("/kundali-pdf-result");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to fetch Kundali basic details"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact style={styles.headerAction} onPress={() => router.back()}>
          {t("Back")}
        </Button>
        <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
          {t("Kundali")}
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
        <View style={styles.hero}>
          <Text variant="headlineSmall" style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>
            {t("Free Kundali Online By Date of Birth")}
          </Text>
          <Text style={styles.heroSubtitle}>{t("Get an instant & accurate Janam Kundli")}</Text>
        </View>

        <View style={styles.kundliGrid}>
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>{t("New Kundli")}</Text>

            <View style={styles.twoColumnRow}>
              <View style={styles.column}>
                <LabeledInput
                  label="Name"
                  required
                  value={form.fullName}
                  onChangeText={(value) => update("fullName", value)}
                  error={submitted && Boolean(errors.fullName)}
                />
                <FieldError visible={submitted} message={errors.fullName} />
              </View>

              <View style={styles.column}>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>{t("Gender")} <Text style={styles.required}>*</Text></Text>
                  <View style={styles.genderRow}>
                    {genders.map((gender) => (
                      <Pressable
                        key={gender}
                        style={[styles.genderButton, form.gender === gender && styles.genderButtonActive]}
                        onPress={() => update("gender", gender)}
                      >
                        <Text style={[styles.genderText, form.gender === gender && styles.genderTextActive]}>{t(titleCase(gender))}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={styles.column}>
                <PickerField
                  icon="calendar-month-outline"
                  label="Birth Date"
                  required
                  value={formatDisplayDate(form)}
                  placeholder="Select birth date"
                  error={submitted && Boolean(errors.day || errors.month || errors.year)}
                  onPress={() => setShowDatePicker(true)}
                />
                <FieldError visible={submitted} message={errors.day || errors.month || errors.year} />
              </View>

              <View style={styles.column}>
                <PickerField
                  icon="clock-outline"
                  label="Birth Time"
                  value={formatDisplayTime(form)}
                  placeholder="Select time, e.g. 10:30 AM"
                  error={submitted && Boolean(errors.hour || errors.min || errors.sec)}
                  onPress={() => setShowTimePicker(true)}
                />
                <FieldError visible={submitted} message={errors.hour || errors.min || errors.sec} />
              </View>
            </View>

            <LabeledInput
              label="Birth Place"
              required
              value={form.place}
              onChangeText={updatePlace}
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
                    <Text style={styles.muted}>{place.timezoneId || place.countryName || indiaTimeZone}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {showDatePicker ? (
              <DateTimePicker
                value={parseFormDate(form) || new Date(1990, 0, 1)}
                mode="date"
                minimumDate={minimumBirthDate}
                maximumDate={new Date()}
                onValueChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDateParts(selectedDate, setForm);
                }}
                onDismiss={() => setShowDatePicker(false)}
                onNeutralButtonPress={() => setShowDatePicker(false)}
              />
            ) : null}

            {showTimePicker ? (
              <DateTimePicker
                value={parseFormTime(form)}
                mode="time"
                is24Hour={false}
                onValueChange={(_, selectedDate) => {
                  setShowTimePicker(false);
                  if (selectedDate) setTimeParts(selectedDate, setForm);
                }}
                onDismiss={() => setShowTimePicker(false)}
                onNeutralButtonPress={() => setShowTimePicker(false)}
              />
            ) : null}

            {submitError ? <Text style={styles.errorText}>{t(submitError)}</Text> : null}
            <Button mode="contained" icon="arrow-right" loading={submitting} disabled={!canSubmit && submitted} onPress={submit} style={styles.submitButton} contentStyle={styles.submitContent}>
              {t("Generate Kundli")}
            </Button>
          </View>

          <View style={styles.savedCard}>
            <Text style={styles.cardTitle}>{t("Saved Kundli")}</Text>
            <View style={styles.savedBox}>
              <Text style={styles.savedIcon}>⌾</Text>
              <Text style={styles.muted}>{t("Please log in to see your saved horoscopes")}</Text>
              <Button mode="outlined" compact>{t("Login")}</Button>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function LabeledInput({
  error,
  label,
  onChangeText,
  required = false,
  right,
  value
}: {
  error?: boolean;
  label: string;
  onChangeText: (value: string) => void;
  required?: boolean;
  right?: React.ReactNode;
  value: string;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{t(label)} {required ? <Text style={styles.required}>*</Text> : null}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        error={error}
        right={right}
        outlineStyle={styles.inputOutline}
        style={styles.input}
      />
    </View>
  );
}

function PickerField({
  error,
  icon,
  label,
  onPress,
  placeholder,
  required = false,
  value
}: {
  error?: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{t(label)} {required ? <Text style={styles.required}>*</Text> : null}</Text>
      <Pressable style={[styles.pickerField, error && styles.pickerFieldError]} onPress={onPress}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.cocoa} style={styles.pickerIcon} />
        <Text style={[styles.pickerText, !value && styles.placeholderText]} numberOfLines={1}>
          {value || t(placeholder)}
        </Text>
      </Pressable>
    </View>
  );
}

function FieldError({ visible, message }: { visible: boolean; message?: string }) {
  const { t } = useTranslation();
  if (!visible || !message) return null;
  return <Text style={styles.fieldError}>{t(message)}</Text>;
}

function parseFormDate(form: FormState) {
  if (!inRange(form.day, 1, 31) || !inRange(form.month, 1, 12) || !inRange(form.year, 1900, new Date().getFullYear())) return null;
  return new Date(Number(form.year), Number(form.month) - 1, Number(form.day));
}

function parseFormTime(form: FormState) {
  const date = new Date();
  date.setHours(Number(form.hour || 0), Number(form.min || 0), Number(form.sec || 0), 0);
  return date;
}

function setDateParts(date: Date, setForm: Dispatch<SetStateAction<FormState>>) {
  setForm((current) => ({
    ...current,
    day: pad2(date.getDate()),
    month: pad2(date.getMonth() + 1),
    year: String(date.getFullYear())
  }));
}

function setTimeParts(date: Date, setForm: Dispatch<SetStateAction<FormState>>) {
  setForm((current) => ({
    ...current,
    hour: pad2(date.getHours()),
    min: pad2(date.getMinutes()),
    sec: pad2(date.getSeconds())
  }));
}

function formatDisplayDate(form: FormState) {
  const date = parseFormDate(form);
  if (!date) return "";
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDisplayTime(form: FormState) {
  if (!inRange(form.hour, 0, 23) || !inRange(form.min, 0, 59)) return "";
  const hour = Number(form.hour);
  const minute = Number(form.min);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${pad2(minute)} ${period}`;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function normalizeNumberField(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : value.trim();
}

function getPayloadTimeZone() {
  return indiaTimeZoneOffset;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function validate(form: FormState, selectedPlace: GeoLocationPlace | null) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.fullName.trim()) errors.fullName = "Name is required";
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

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fbfbef" },
  header: { minHeight: 58, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  headerAction: { width: 86, marginLeft: -8 },
  headerTitle: { flex: 1, color: colors.ink, fontWeight: "800", textAlign: "center" },
  formScroller: { flex: 1 },
  content: { alignSelf: "center", width: "100%", maxWidth: 1160, padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { alignItems: "center", gap: spacing.xs },
  heroTitle: { color: colors.amber, fontWeight: "900", lineHeight: 31, textAlign: "center" },
  heroSubtitle: { color: colors.cocoa, fontSize: 12, lineHeight: 17, textAlign: "center" },
  kundliGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, alignItems: "stretch" },
  formCard: { flex: 1.05, minWidth: 310, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.sm },
  savedCard: { flex: 1, minWidth: 310, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  savedBox: { flex: 1, minHeight: 230, borderRadius: 8, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.lg },
  savedIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#fffef5", color: colors.cocoa, fontSize: 28, lineHeight: 42, textAlign: "center" },
  cardTitle: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: "900", marginBottom: spacing.xs },
  twoColumnRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  column: { flex: 1, minWidth: 210, gap: spacing.xs },
  fieldBlock: { gap: spacing.xs },
  fieldLabel: { color: colors.cocoa, fontSize: 11, lineHeight: 15, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" },
  required: { color: colors.danger },
  input: { backgroundColor: colors.surface },
  inputOutline: { borderRadius: 8, borderColor: colors.border },
  pickerField: { minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md },
  pickerIcon: { width: 20, textAlign: "center" },
  pickerFieldError: { borderColor: colors.danger },
  pickerText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: "700" },
  placeholderText: { color: colors.cocoa, fontSize: 12, fontWeight: "600" },
  genderRow: { flexDirection: "row", gap: spacing.sm },
  genderButton: { flex: 1, minHeight: 43, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  genderButtonActive: { borderColor: colors.lime, backgroundColor: colors.lime },
  genderText: { color: colors.ink, fontWeight: "800" },
  genderTextActive: { color: colors.ink },
  suggestions: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" },
  suggestionItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 2 },
  suggestionTitle: { color: colors.ink, fontWeight: "800" },
  muted: { color: colors.cocoa },
  fieldError: { color: colors.danger, fontSize: 12, fontWeight: "700" },
  errorText: { color: colors.danger, fontWeight: "700" },
  submitButton: { alignSelf: "center", minWidth: 190, borderRadius: 24, marginTop: spacing.sm },
  submitContent: { minHeight: 48, flexDirection: "row-reverse" }
});
