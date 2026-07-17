import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button, Checkbox, Menu, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { LanguageSelector } from "@/components/LanguageSelector";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import {
  ChartStyle,
  GeoLocationPlace,
  getGeolocationPlaces,
  generateMatchMakingPdf,
  MatchMakingPdfPayload,
  MatchMakingPersonPayload
} from "@/services/kundali.service";
import { useMatchMakingStore } from "@/store/matchMaking.store";
import { getApiLanguageName } from "@/utils/language";

const chartStyles: ChartStyle[] = ["NORTH_INDIAN", "SOUTH_INDIAN", "EAST_INDIAN", "WEST_INDIAN"];
const genders = ["male", "female", "other"] as const;
const personKeys = ["p1", "p2"] as const;

type PersonKey = (typeof personKeys)[number];
type OptionKey = keyof MatchMakingPdfPayload["options"];

type PersonForm = {
  firstName: string;
  lastName: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  min: string;
  sec: string;
  gender: string;
  place: string;
};

type FormState = {
  p1: PersonForm;
  p2: PersonForm;
  options: Record<OptionKey, boolean>;
  chartStyle: ChartStyle;
};

const initialPerson: PersonForm = {
  firstName: "",
  lastName: "",
  day: "",
  month: "",
  year: "",
  hour: "",
  min: "",
  sec: "0",
  gender: "male",
  place: ""
};

const initialForm: FormState = {
  p1: initialPerson,
  p2: { ...initialPerson, gender: "female" },
  options: {
    ashtakoot: false,
    dashakoot: false,
    papasamyam: false
  },
  chartStyle: "NORTH_INDIAN"
};

export function MatchMakingPdfScreen() {
  const { language, t } = useTranslation();
  const setResult = useMatchMakingStore((state) => state.setResult);
  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedPlaces, setSelectedPlaces] = useState<Record<PersonKey, GeoLocationPlace | null>>({ p1: null, p2: null });
  const [places, setPlaces] = useState<Record<PersonKey, GeoLocationPlace[]>>({ p1: [], p2: [] });
  const [placeLoading, setPlaceLoading] = useState<Record<PersonKey, boolean>>({ p1: false, p2: false });
  const [placeErrors, setPlaceErrors] = useState<Record<PersonKey, string>>({ p1: "", p2: "" });
  const [chartMenuOpen, setChartMenuOpen] = useState(false);
  const [genderMenuOpen, setGenderMenuOpen] = useState<PersonKey | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const errors = useMemo(() => validate(form, selectedPlaces), [form, selectedPlaces]);
  const canSubmit = Object.keys(errors).length === 0 && !submitting;

  useEffect(() => {
    return loadPlaceSuggestions("p1", form.p1.place, selectedPlaces.p1);
  }, [form.p1.place, selectedPlaces.p1?.placeName]);

  useEffect(() => {
    return loadPlaceSuggestions("p2", form.p2.place, selectedPlaces.p2);
  }, [form.p2.place, selectedPlaces.p2?.placeName]);

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

  const selectPlace = (personKey: PersonKey, place: GeoLocationPlace) => {
    setSelectedPlaces((current) => ({ ...current, [personKey]: place }));
    updatePerson(personKey, "place", place.placeName);
    setPlaces((current) => ({ ...current, [personKey]: [] }));
  };

  const toggleOption = (key: OptionKey) => {
    setForm((current) => ({
      ...current,
      options: {
        ...current.options,
        [key]: !current.options[key]
      }
    }));
  };

  const submit = async () => {
    setSubmitted(true);
    setSubmitError("");

    if (!canSubmit || !selectedPlaces.p1 || !selectedPlaces.p2) return;

    const payload: MatchMakingPdfPayload = {
      p1: toPersonPayload(form.p1, selectedPlaces.p1),
      p2: toPersonPayload(form.p2, selectedPlaces.p2),
      options: {
        ashtakoot: boolString(form.options.ashtakoot),
        dashakoot: boolString(form.options.dashakoot),
        papasamyam: boolString(form.options.papasamyam)
      },
      branding: {
        chartStyle: form.chartStyle
      },
      language: getApiLanguageName(language),
      languageCode: language
    };

    try {
      setSubmitting(true);
      const response = await generateMatchMakingPdf(payload);
      setResult(response, payload);
      router.push("/match-making-pdf-result");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to generate Match Making PDF"));
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
        <View style={styles.intro}>
          <Text variant="headlineSmall" style={styles.introTitle} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Create Match Making PDF")}</Text>
          <Text style={styles.muted}>{t("Enter both birth details and select places from suggestions.")}</Text>
        </View>

        <PersonSection
          title="Person 1"
          personKey="p1"
          form={form.p1}
          errors={errors}
          submitted={submitted}
          genderMenuOpen={genderMenuOpen === "p1"}
          placeLoading={placeLoading.p1}
          placeError={placeErrors.p1}
          places={places.p1}
          onOpenGender={() => setGenderMenuOpen("p1")}
          onCloseGender={() => setGenderMenuOpen(null)}
          onUpdate={updatePerson}
          onSelectPlace={selectPlace}
        />

        <PersonSection
          title="Person 2"
          personKey="p2"
          form={form.p2}
          errors={errors}
          submitted={submitted}
          genderMenuOpen={genderMenuOpen === "p2"}
          placeLoading={placeLoading.p2}
          placeError={placeErrors.p2}
          places={places.p2}
          onOpenGender={() => setGenderMenuOpen("p2")}
          onCloseGender={() => setGenderMenuOpen(null)}
          onUpdate={updatePerson}
          onSelectPlace={selectPlace}
        />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Report Options")}</Text>
          {(["ashtakoot", "dashakoot", "papasamyam"] as OptionKey[]).map((key) => (
            <Checkbox.Item
              key={key}
              label={t(optionLabel(key))}
              status={form.options[key] ? "checked" : "unchecked"}
              onPress={() => toggleOption(key)}
              style={styles.checkboxItem}
              labelStyle={styles.checkboxLabel}
            />
          ))}
        </View>

        <Menu
          visible={chartMenuOpen}
          onDismiss={() => setChartMenuOpen(false)}
          anchor={
            <Pressable style={styles.selectBox} onPress={() => setChartMenuOpen(true)}>
              <Text style={styles.selectLabel}>{t("Chart Style")}</Text>
              <Text style={styles.selectValue}>{form.chartStyle}</Text>
              <MaterialCommunityIcons name="chevron-down" size={22} color={colors.cocoa} />
            </Pressable>
          }
        >
          {chartStyles.map((style) => (
            <Menu.Item key={style} title={style} onPress={() => {
              setForm((current) => ({ ...current, chartStyle: style }));
              setChartMenuOpen(false);
            }} />
          ))}
        </Menu>

        {submitError ? <Text style={styles.errorText}>{t(submitError)}</Text> : null}
        <Button mode="contained" loading={submitting} disabled={!canSubmit && submitted} onPress={submit}>
          {t("Generate Match Making PDF")}
        </Button>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function PersonSection({
  title,
  personKey,
  form,
  errors,
  submitted,
  genderMenuOpen,
  placeLoading,
  placeError,
  places,
  onOpenGender,
  onCloseGender,
  onUpdate,
  onSelectPlace
}: {
  title: string;
  personKey: PersonKey;
  form: PersonForm;
  errors: Partial<Record<string, string>>;
  submitted: boolean;
  genderMenuOpen: boolean;
  placeLoading: boolean;
  placeError: string;
  places: GeoLocationPlace[];
  onOpenGender: () => void;
  onCloseGender: () => void;
  onUpdate: (personKey: PersonKey, key: keyof PersonForm, value: string) => void;
  onSelectPlace: (personKey: PersonKey, place: GeoLocationPlace) => void;
}) {
  const { t } = useTranslation();
  const errorKey = (key: keyof PersonForm) => `${personKey}.${key}`;

  return (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t(title)}</Text>

      <View style={styles.row}>
        <TextInput
          style={styles.smallInput}
          label={t("First Name")}
          value={form.firstName}
          onChangeText={(value) => onUpdate(personKey, "firstName", value)}
          mode="outlined"
          error={submitted && Boolean(errors[errorKey("firstName")])}
        />
        <TextInput
          style={styles.smallInput}
          label={t("Last Name")}
          value={form.lastName}
          onChangeText={(value) => onUpdate(personKey, "lastName", value)}
          mode="outlined"
          error={submitted && Boolean(errors[errorKey("lastName")])}
        />
      </View>
      <FieldError visible={submitted} message={errors[errorKey("firstName")] || errors[errorKey("lastName")]} />

      <View style={styles.row}>
        <SmallInput label="Day" value={form.day} onChangeText={(value) => onUpdate(personKey, "day", digits(value, 2))} error={submitted && Boolean(errors[errorKey("day")])} />
        <SmallInput label="Month" value={form.month} onChangeText={(value) => onUpdate(personKey, "month", digits(value, 2))} error={submitted && Boolean(errors[errorKey("month")])} />
        <SmallInput label="Year" value={form.year} onChangeText={(value) => onUpdate(personKey, "year", digits(value, 4))} error={submitted && Boolean(errors[errorKey("year")])} />
      </View>
      <FieldError visible={submitted} message={errors[errorKey("day")] || errors[errorKey("month")] || errors[errorKey("year")]} />

      <View style={styles.row}>
        <SmallInput label="Hour" value={form.hour} onChangeText={(value) => onUpdate(personKey, "hour", digits(value, 2))} error={submitted && Boolean(errors[errorKey("hour")])} />
        <SmallInput label="Min" value={form.min} onChangeText={(value) => onUpdate(personKey, "min", digits(value, 2))} error={submitted && Boolean(errors[errorKey("min")])} />
        <SmallInput label="Sec" value={form.sec} onChangeText={(value) => onUpdate(personKey, "sec", digits(value, 2))} error={submitted && Boolean(errors[errorKey("sec")])} />
      </View>
      <FieldError visible={submitted} message={errors[errorKey("hour")] || errors[errorKey("min")] || errors[errorKey("sec")]} />

      <Menu
        visible={genderMenuOpen}
        onDismiss={onCloseGender}
        anchor={
          <Pressable style={styles.selectBox} onPress={onOpenGender}>
            <Text style={styles.selectLabel}>{t("Gender")}</Text>
            <Text style={styles.selectValue}>{t(form.gender)}</Text>
            <MaterialCommunityIcons name="chevron-down" size={22} color={colors.cocoa} />
          </Pressable>
        }
      >
        {genders.map((gender) => (
          <Menu.Item key={gender} title={t(gender)} onPress={() => {
            onUpdate(personKey, "gender", gender);
            onCloseGender();
          }} />
        ))}
      </Menu>

      <TextInput
        label={t("Birth Place")}
        value={form.place}
        onChangeText={(value) => onUpdate(personKey, "place", value)}
        mode="outlined"
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
              <Text style={styles.muted}>{place.timezoneId || place.countryName}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function SmallInput({ label, value, onChangeText, error }: { label: string; value: string; onChangeText: (value: string) => void; error?: boolean }) {
  const { t } = useTranslation();
  return (
    <TextInput
      style={styles.smallInput}
      label={t(label)}
      value={value}
      onChangeText={onChangeText}
      mode="outlined"
      keyboardType="number-pad"
      error={error}
    />
  );
}

function FieldError({ visible, message }: { visible: boolean; message?: string }) {
  const { t } = useTranslation();
  if (!visible || !message) return null;
  return <Text style={styles.fieldError}>{t(message)}</Text>;
}

function toPersonPayload(form: PersonForm, place: GeoLocationPlace): MatchMakingPersonPayload {
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();

  return {
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
    day: form.day.trim(),
    month: form.month.trim(),
    year: form.year.trim(),
    hour: form.hour.trim(),
    min: form.min.trim(),
    sec: form.sec.trim() || "0",
    lat: place.latitude,
    lon: place.longitude,
    gender: form.gender,
    place: place.placeName
  };
}

function validate(form: FormState, selectedPlaces: Record<PersonKey, GeoLocationPlace | null>) {
  const errors: Partial<Record<string, string>> = {};

  personKeys.forEach((personKey) => {
    const person = form[personKey];
    const prefix = `${personKey}.`;

    if (!person.firstName.trim()) errors[`${prefix}firstName`] = "First name is required";
    if (!person.lastName.trim()) errors[`${prefix}lastName`] = "Last name is required";
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

function digits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function inRange(value: string, min: number, max: number) {
  if (!value.trim()) return false;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max;
}

function boolString(value: boolean): "true" | "false" {
  return value ? "true" : "false";
}

function optionLabel(key: OptionKey) {
  if (key === "ashtakoot") return "Ashtakoot";
  if (key === "dashakoot") return "Dashakoot";
  return "Papasamyam";
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
  section: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.md },
  sectionTitle: { color: colors.ink, fontWeight: "900", lineHeight: 22 },
  muted: { color: colors.cocoa },
  row: { flexDirection: "row", gap: spacing.sm },
  smallInput: { flex: 1 },
  selectBox: { minHeight: 58, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  selectLabel: { color: colors.cocoa, fontSize: 12, fontWeight: "800" },
  selectValue: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: "900", textTransform: "capitalize" },
  checkboxItem: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff7df", paddingVertical: 2 },
  checkboxLabel: { color: colors.ink, fontWeight: "800" },
  suggestions: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" },
  suggestionItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 2 },
  suggestionTitle: { color: colors.ink, fontWeight: "800" },
  fieldError: { marginTop: -spacing.sm, color: colors.danger, fontSize: 12, fontWeight: "700" },
  errorText: { color: colors.danger, fontWeight: "700" }
});
