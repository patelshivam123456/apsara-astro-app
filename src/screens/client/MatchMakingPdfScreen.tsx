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
  generateMatchMakingPdf,
  GeoLocationPlace,
  getGeolocationPlaces,
  MatchMakingPdfPayload,
  MatchMakingPersonPayload
} from "@/services/kundali.service";
import { useMatchMakingStore } from "@/store/matchMaking.store";

const genders = ["male", "female"] as const;
const personKeys = ["p1", "p2"] as const;
const indiaTimeZone = "GMT +05:30";
const indiaTimeZoneOffset = "5.5";
const minimumBirthDate = new Date(1900, 0, 1);

type PersonKey = (typeof personKeys)[number];

type PersonForm = {
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

type FormState = Record<PersonKey, PersonForm>;

const initialPerson: PersonForm = {
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

const initialForm: FormState = {
  p1: initialPerson,
  p2: { ...initialPerson, gender: "female" }
};

export function MatchMakingPdfScreen() {
  const { language, t } = useTranslation();
  const setResult = useMatchMakingStore((state) => state.setResult);
  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedPlaces, setSelectedPlaces] = useState<Record<PersonKey, GeoLocationPlace | null>>({ p1: null, p2: null });
  const [places, setPlaces] = useState<Record<PersonKey, GeoLocationPlace[]>>({ p1: [], p2: [] });
  const [placeLoading, setPlaceLoading] = useState<Record<PersonKey, boolean>>({ p1: false, p2: false });
  const [placeErrors, setPlaceErrors] = useState<Record<PersonKey, string>>({ p1: "", p2: "" });
  const [datePickerKey, setDatePickerKey] = useState<PersonKey | null>(null);
  const [timePickerKey, setTimePickerKey] = useState<PersonKey | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const errors = useMemo(() => validate(form, selectedPlaces), [form, selectedPlaces]);
  const canSubmit = Object.keys(errors).length === 0 && !submitting;

  useEffect(() => loadPlaceSuggestions("p1", form.p1.place, selectedPlaces.p1), [form.p1.place, selectedPlaces.p1]);
  useEffect(() => loadPlaceSuggestions("p2", form.p2.place, selectedPlaces.p2), [form.p2.place, selectedPlaces.p2]);

  const loadPlaceSuggestions = (personKey: PersonKey, placeValue: string, selectedPlace: GeoLocationPlace | null) => {
    const query = placeValue.trim();

    if (selectedPlace?.placeName === query) {
      setPlaces((current) => ({ ...current, [personKey]: [] }));
      setPlaceErrors((current) => ({ ...current, [personKey]: "" }));
      return undefined;
    }

    setSelectedPlaces((current) => current[personKey] ? { ...current, [personKey]: null } : current);
    setPlaceErrors((current) => ({ ...current, [personKey]: "" }));

    if (query.length < 3) {
      setPlaces((current) => ({ ...current, [personKey]: [] }));
      return undefined;
    }

    const timeout = setTimeout(async () => {
      try {
        setPlaceLoading((current) => ({ ...current, [personKey]: true }));
        const response = await getGeolocationPlaces(query);
        setPlaces((current) => ({ ...current, [personKey]: response }));
      } catch (error) {
        setPlaceErrors((current) => ({ ...current, [personKey]: getApiErrorMessage(error, "Unable to load place suggestions") }));
      } finally {
        setPlaceLoading((current) => ({ ...current, [personKey]: false }));
      }
    }, 350);

    return () => clearTimeout(timeout);
  };

  const updatePerson = (personKey: PersonKey, key: keyof PersonForm, value: string) => {
    setForm((current) => ({
      ...current,
      [personKey]: {
        ...current[personKey],
        [key]: value
      }
    }));
  };

  const updatePlace = (personKey: PersonKey, value: string) => {
    setSelectedPlaces((current) => ({ ...current, [personKey]: null }));
    setPlaces((current) => ({ ...current, [personKey]: [] }));
    setPlaceErrors((current) => ({ ...current, [personKey]: "" }));
    updatePerson(personKey, "place", value);
  };

  const selectPlace = (personKey: PersonKey, place: GeoLocationPlace) => {
    setSelectedPlaces((current) => ({ ...current, [personKey]: place }));
    updatePerson(personKey, "place", place.placeName);
    setPlaces((current) => ({ ...current, [personKey]: [] }));
  };

  const submit = async () => {
    setSubmitted(true);
    setSubmitError("");

    if (!canSubmit || !selectedPlaces.p1 || !selectedPlaces.p2) return;

    const p1 = toPersonPayload(form.p1, selectedPlaces.p1);
    const p2 = toPersonPayload(form.p2, selectedPlaces.p2);
    const payload: MatchMakingPdfPayload = {
      p1FullName: p1.fullName,
      p1Day: p1.day,
      p1Month: p1.month,
      p1Year: p1.year,
      p1Hour: p1.hour,
      p1Min: p1.min,
      p1Sec: p1.sec,
      p1Gender: p1.gender,
      p1Place: p1.place,
      p1Latitude: p1.latitude,
      p1Longitude: p1.longitude,
      p1TimeZone: p1.timeZone,
      p2FullName: p2.fullName,
      p2Day: p2.day,
      p2Month: p2.month,
      p2Year: p2.year,
      p2Hour: p2.hour,
      p2Min: p2.min,
      p2Sec: p2.sec,
      p2Gender: p2.gender,
      p2Place: p2.place,
      p2Latitude: p2.latitude,
      p2Longitude: p2.longitude,
      p2TimeZone: p2.timeZone,
      language,
      languageCode: language
    };

    try {
      setSubmitting(true);
      const response = await generateMatchMakingPdf(payload);
      setResult(response, payload);
      router.push("/match-making-pdf-result");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to load match making report"));
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
          {t("Match Making PDF")}
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
            {t("Match Making PDF")}
          </Text>
          <Text style={styles.heroSubtitle}>{t("Enter birth details to generate match making report")}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>{t("New Match")}</Text>
          {personKeys.map((personKey, index) => (
            <PersonCard
              key={personKey}
              title={index === 0 ? "Your Details" : "Partner's Details"}
              personKey={personKey}
              form={form[personKey]}
              errors={errors}
              submitted={submitted}
              placeLoading={placeLoading[personKey]}
              placeError={placeErrors[personKey]}
              places={places[personKey]}
              onOpenDate={() => setDatePickerKey(personKey)}
              onOpenTime={() => setTimePickerKey(personKey)}
              onSelectPlace={selectPlace}
              onUpdate={updatePerson}
              onUpdatePlace={updatePlace}
            />
          ))}
        </View>

        {datePickerKey ? (
          <DateTimePicker
            value={parseFormDate(form[datePickerKey]) || new Date(1990, 0, 1)}
            mode="date"
            minimumDate={minimumBirthDate}
            maximumDate={new Date()}
            onValueChange={(_, selectedDate) => {
              const key = datePickerKey;
              setDatePickerKey(null);
              if (selectedDate) setDateParts(key, selectedDate, setForm);
            }}
            onDismiss={() => setDatePickerKey(null)}
            onNeutralButtonPress={() => setDatePickerKey(null)}
          />
        ) : null}

        {timePickerKey ? (
          <DateTimePicker
            value={parseFormTime(form[timePickerKey])}
            mode="time"
            is24Hour={false}
            onValueChange={(_, selectedDate) => {
              const key = timePickerKey;
              setTimePickerKey(null);
              if (selectedDate) setTimeParts(key, selectedDate, setForm);
            }}
            onDismiss={() => setTimePickerKey(null)}
            onNeutralButtonPress={() => setTimePickerKey(null)}
          />
        ) : null}

        {submitError ? <Text style={styles.errorText}>{t(submitError)}</Text> : null}
        <Button mode="contained" icon="arrow-right" loading={submitting} disabled={!canSubmit && submitted} onPress={submit} style={styles.submitButton} contentStyle={styles.submitContent}>
          {t("Match Horoscope")}
        </Button>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function PersonCard({
  errors,
  form,
  onOpenDate,
  onOpenTime,
  onSelectPlace,
  onUpdate,
  onUpdatePlace,
  personKey,
  placeError,
  placeLoading,
  places,
  submitted,
  title
}: {
  errors: Partial<Record<string, string>>;
  form: PersonForm;
  onOpenDate: () => void;
  onOpenTime: () => void;
  onSelectPlace: (personKey: PersonKey, place: GeoLocationPlace) => void;
  onUpdate: (personKey: PersonKey, key: keyof PersonForm, value: string) => void;
  onUpdatePlace: (personKey: PersonKey, value: string) => void;
  personKey: PersonKey;
  placeError: string;
  placeLoading: boolean;
  places: GeoLocationPlace[];
  submitted: boolean;
  title: string;
}) {
  const { t } = useTranslation();
  const errorKey = (key: keyof PersonForm) => `${personKey}.${key}`;

  return (
    <View style={styles.personSection}>
      <Text style={styles.personTitle}>{t(title)}</Text>

      <View style={styles.twoColumnRow}>
        <View style={styles.column}>
          <LabeledInput
            label="Name"
            required
            value={form.fullName}
            onChangeText={(value) => onUpdate(personKey, "fullName", value)}
            error={submitted && Boolean(errors[errorKey("fullName")])}
          />
          <FieldError visible={submitted} message={errors[errorKey("fullName")]} />
        </View>

        <View style={styles.column}>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>{t("Gender")} <Text style={styles.required}>*</Text></Text>
            <View style={styles.genderRow}>
              {genders.map((gender) => (
                <Pressable
                  key={gender}
                  style={[styles.genderButton, form.gender === gender && styles.genderButtonActive]}
                  onPress={() => onUpdate(personKey, "gender", gender)}
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
            error={submitted && Boolean(errors[errorKey("day")] || errors[errorKey("month")] || errors[errorKey("year")])}
            onPress={onOpenDate}
          />
          <FieldError visible={submitted} message={errors[errorKey("day")] || errors[errorKey("month")] || errors[errorKey("year")]} />
        </View>

        <View style={styles.column}>
          <PickerField
            icon="clock-outline"
            label="Birth Time"
            value={formatDisplayTime(form)}
            placeholder="Select time, e.g. 10:30 AM"
            error={submitted && Boolean(errors[errorKey("hour")] || errors[errorKey("min")] || errors[errorKey("sec")])}
            onPress={onOpenTime}
          />
          <FieldError visible={submitted} message={errors[errorKey("hour")] || errors[errorKey("min")] || errors[errorKey("sec")]} />
        </View>
      </View>

      <LabeledInput
        label="Birth Place"
        required
        value={form.place}
        onChangeText={(value) => onUpdatePlace(personKey, value)}
        error={submitted && Boolean(errors[errorKey("place")])}
        right={placeLoading ? <TextInput.Icon icon="loading" /> : undefined}
      />
      <FieldError visible={submitted} message={errors[errorKey("place")]} />
      {placeError ? <Text style={styles.errorText}>{t(placeError)}</Text> : null}
      {places.length ? (
        <View style={styles.suggestions}>
          {places.map((place) => (
            <Pressable key={`${personKey}-${place.placeName}-${place.latitude}-${place.longitude}`} style={styles.suggestionItem} onPress={() => onSelectPlace(personKey, place)}>
              <Text style={styles.suggestionTitle}>{place.placeName}</Text>
              <Text style={styles.muted}>{place.timezoneId || place.countryName || indiaTimeZone}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
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

function toPersonPayload(form: PersonForm, place: GeoLocationPlace): MatchMakingPersonPayload {
  return {
    fullName: form.fullName.trim(),
    day: normalizeNumberField(form.day),
    month: normalizeNumberField(form.month),
    year: form.year.trim(),
    hour: normalizeNumberField(form.hour),
    min: normalizeNumberField(form.min),
    sec: normalizeNumberField(form.sec || "00"),
    latitude: place.latitude,
    longitude: place.longitude,
    timeZone: indiaTimeZoneOffset,
    gender: form.gender,
    place: place.placeName
  };
}

function validate(form: FormState, selectedPlaces: Record<PersonKey, GeoLocationPlace | null>) {
  const errors: Partial<Record<string, string>> = {};

  personKeys.forEach((personKey) => {
    const person = form[personKey];
    const prefix = `${personKey}.`;

    if (!person.fullName.trim()) errors[`${prefix}fullName`] = "Name is required";
    if (!inRange(person.day, 1, 31)) errors[`${prefix}day`] = "Enter a valid day";
    if (!inRange(person.month, 1, 12)) errors[`${prefix}month`] = "Enter a valid month";
    if (!inRange(person.year, 1900, new Date().getFullYear())) errors[`${prefix}year`] = "Enter a valid year";
    if (!inRange(person.hour, 0, 23)) errors[`${prefix}hour`] = "Enter a valid hour";
    if (!inRange(person.min, 0, 59)) errors[`${prefix}min`] = "Enter a valid minute";
    if (person.sec && !inRange(person.sec, 0, 59)) errors[`${prefix}sec`] = "Enter a valid second";
    if (!person.place.trim() || !selectedPlaces[personKey]) errors[`${prefix}place`] = "Select a birth place from suggestions";
  });

  return errors;
}

function parseFormDate(form: PersonForm) {
  if (!inRange(form.day, 1, 31) || !inRange(form.month, 1, 12) || !inRange(form.year, 1900, new Date().getFullYear())) return null;
  return new Date(Number(form.year), Number(form.month) - 1, Number(form.day));
}

function parseFormTime(form: PersonForm) {
  const date = new Date();
  date.setHours(Number(form.hour || 0), Number(form.min || 0), Number(form.sec || 0), 0);
  return date;
}

function setDateParts(personKey: PersonKey, date: Date, setForm: Dispatch<SetStateAction<FormState>>) {
  setForm((current) => ({
    ...current,
    [personKey]: {
      ...current[personKey],
      day: pad2(date.getDate()),
      month: pad2(date.getMonth() + 1),
      year: String(date.getFullYear())
    }
  }));
}

function setTimeParts(personKey: PersonKey, date: Date, setForm: Dispatch<SetStateAction<FormState>>) {
  setForm((current) => ({
    ...current,
    [personKey]: {
      ...current[personKey],
      hour: pad2(date.getHours()),
      min: pad2(date.getMinutes()),
      sec: pad2(date.getSeconds())
    }
  }));
}

function formatDisplayDate(form: PersonForm) {
  const date = parseFormDate(form);
  if (!date) return "";
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDisplayTime(form: PersonForm) {
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

function inRange(value: string, min: number, max: number) {
  if (!value.trim()) return false;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  formCard: { width: "100%", borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.lg },
  cardTitle: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: "900", marginBottom: spacing.xs },
  personSection: { gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  personTitle: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: "900" },
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
