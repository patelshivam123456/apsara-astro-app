import { useMemo, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Button,
  Checkbox,
  Chip,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { getApiErrorMessage } from "@/services/apiClient";
import { registerAstrologer } from "@/services/auth.service";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type Step = 1 | 2 | 3 | 4;

const declarationText =
  "I hereby declare that all information provided is true and I have no criminal record.";

const expertiseOptions = [
  "Astrology",
  "Numerology",
  "Vastu",
  "Palmistry",
  "Graphology",
  "Reiki",
  "Tarot",
];

const consultationModeOptions = ["Chat", "Call", "Video"];
const genderOptions = ["Male", "Female", "Other"];

const stepLabels = ["Personal", "Identity", "Education", "Submit"];

export function RegisterScreen() {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("India");
  const [gender, setGender] = useState("");
  const [genderOpen, setGenderOpen] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [address, setAddress] = useState("");
  const [religion, setReligion] = useState("");
  const [specialization, setSpecialization] = useState("");

  const [languageInput, setLanguageInput] = useState("");
  const [languagesKnown, setLanguagesKnown] = useState<string[]>([]);
  const [consultationModes, setConsultationModes] = useState<string[]>([]);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [aboutYourself, setAboutYourself] = useState("");

  const [aadhaarNo, setAadhaarNo] = useState("");
  const [aadhaarFile, setAadhaarFile] = useState<any>(null);
  const [educationalQualification, setEducationalQualification] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [educationDoc, setEducationDoc] = useState<any>(null);
  const [certificateDoc, setCertificateDoc] = useState<any>(null);
  const [experienceLetter, setExperienceLetter] = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<any>(null);

  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState("");
  const [declarationDate, setDeclarationDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [showDeclarationDate, setShowDeclarationDate] = useState(false);

  const activeStepNumber = step - 1;

  const stepTitle = useMemo(() => {
    if (step === 1) return "Personal & Professional Information";
    if (step === 2) return "Identity Verification";
    if (step === 3) return "Education & Certification";
    return "Declaration";
  }, [step]);

  const inputTheme = {
  colors: {
    background: "#fffaf0",
    primary: "#b6f000",
    outline: "#ead27a",
  },
};

  const showMessage = (text: string) => {
    setError("");
    setMessage(text);
  };

  const showError = (text: string) => {
    setMessage("");
    setError(text);
  };

  const lookupPincode = async (value: string) => {
    const next = value.replace(/\D/g, "").slice(0, 6);
    setPincode(next);

    if (next.length !== 6) return;

    try {
      setPincodeLoading(true);

      const response = await fetch(
        `https://api.postalpincode.in/pincode/${next}`
      );

      const data = await response.json();
      const postOffice = data?.[0]?.PostOffice?.[0];

      if (data?.[0]?.Status === "Success" && postOffice) {
        setCity(postOffice.District || postOffice.Name || "");
        setStateName(postOffice.State || "");
        showMessage("City and state filled from pincode.");
      } else {
        showError("No city/state found for this pincode.");
      }
    } catch {
      showError("Unable to fetch city and state for this pincode.");
    } finally {
      setPincodeLoading(false);
    }
  };

  const addLanguage = () => {
    const value = languageInput.trim();

    if (!value) return;

    setLanguagesKnown((items) => [...new Set([...items, value])]);
    setLanguageInput("");
  };

  const toggleValue = (
    value: string,
    list: string[],
    setList: (items: string[]) => void
  ) => {
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value]
    );
  };

  const pickDocument = async (setter: any) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      setter(result.assets[0]);
    }
  };

  const pickImage = async (setter: any) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showError("Please allow gallery permission.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setter(result.assets[0]);
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!fullName.trim()) return "Full name is required.";
      if (!displayName.trim()) return "Display name is required.";
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        return "Enter a valid email address.";
      }
      if (!/^[0-9]{10}$/.test(mobileNo.trim())) {
        return "Mobile number must be 10 digits.";
      }
      if (!/^[0-9]{6}$/.test(pincode)) return "Pincode must be 6 digits.";
      if (!city.trim() || !stateName.trim()) {
        return "City and state are required.";
      }
      if (!gender.trim()) return "Gender is required.";
      if (!dateOfBirth.trim()) return "Date of birth is required.";
      if (!country.trim()) return "Country is required.";
      if (!religion.trim()) return "Religion is required.";
      if (!specialization.trim()) return "Specialization is required.";
    }

    if (step === 2) {
      if (!/^[0-9]{12}$/.test(aadhaarNo.trim())) {
        return "Aadhaar number must be 12 digits.";
      }
      if (!aadhaarFile) return "Aadhaar upload is required.";
    }

    if (step === 3) {
      if (!educationalQualification.trim()) {
        return "Educational qualification is required.";
      }
      if (!yearsOfExperience.trim()) return "Years of experience is required.";
    }

    if (step === 4) {
      if (!declarationAccepted) return "Please accept the declaration.";
      if (!digitalSignature.trim()) return "Digital signature is required.";
      if (!declarationDate.trim()) return "Declaration date is required.";
    }

    return "";
  };

  const continueStep = () => {
    const validationError = validateStep();

    if (validationError) {
      showError(validationError);
      return;
    }

    setStep((current) => Math.min(4, current + 1) as Step);
  };

  const submit = async () => {
    const validationError = validateStep();

    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      await registerAstrologer({
        fullName,
        mobileNo,
        email,
        gender,
        dateOfBirth,
        pinCode: pincode,
        city,
        state: stateName,
        country,
        languagesKnown,
        religion,
        specialization,
        displayName,
        expertise,
        yearsOfExperience,
        educationalQualification,
        aadhaarNo,
        consultationModes,
        aboutYourself,
        address,
        documents: {
          aadhaarFile,
          educationalQualificationFile: educationDoc,
          experienceFile: experienceLetter,
        },
        declaration: {
          accepted: declarationAccepted,
          digitalSignature,
          date: declarationDate,
          text: declarationText,
        },
      });

      showMessage("Astrologer signup successful. Please login.");

      setTimeout(() => {
        router.replace({
          pathname: "/(auth)/login",
          params: { mode: "astrologer" },
        });
      }, 900);
    } catch (err) {
      const apiError = getApiErrorMessage(err, "Registration failed");
      showError(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
  <KeyboardAwareScrollView
    style={{ flex: 1 }}
    contentContainerStyle={styles.content}
    enableOnAndroid={true}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
    extraScrollHeight={30}
    extraHeight={120}
  >
    <View style={styles.topCard}>
      <Text style={styles.kicker}>SIGN UP AS ASTROLOGER</Text>

      <Text variant="headlineSmall" style={styles.mainTitle}>
        {stepTitle}
      </Text>

      <Text style={styles.muted}>
        Complete your verification profile with ApsaraAstro.
      </Text>
    </View>

    <StepIndicator activeStep={activeStepNumber} />

    <View style={styles.formPanel}>
      {renderStep()}
    </View>

    <Snackbar visible={!!message} onDismiss={() => setMessage("")} duration={3500}>
      {message}
    </Snackbar>

    <Snackbar
      visible={!!error}
      onDismiss={() => setError("")}
      duration={4500}
      style={styles.errorSnack}
    >
      {error}
    </Snackbar>
  </KeyboardAwareScrollView>
</SafeAreaView>
  )
  function renderStep() {
    if (step === 1) {
      return (
        <View style={styles.section}>
          <SectionHeader
            stepLabel="Step 1 of 4"
            title="Personal & Professional Information"
            description="Profile basics, expertise, languages, and consultation modes."
          />

          <View style={styles.twoColumns}>
            <TextInput
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              theme={inputTheme}
              style={[styles.input, styles.field]}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
            />

            <TextInput
              label="Mobile Number *"
              value={mobileNo}
              onChangeText={(value) =>
                setMobileNo(value.replace(/\D/g, "").slice(0, 10))
              }
              keyboardType="phone-pad"
              mode="outlined"
              theme={inputTheme}
              style={[styles.input, styles.field]}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
            />

            <TextInput
              label="Email Address *"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              mode="outlined"
              theme={inputTheme}
              style={[styles.input, styles.field]}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
            />

            <TextInput
              label="Display Name *"
              value={displayName}
              onChangeText={setDisplayName}
              mode="outlined"
              theme={inputTheme}
              style={[styles.input, styles.field]}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
            />

            <TextInput
              label="Pincode *"
              value={pincode}
              onChangeText={lookupPincode}
              keyboardType="number-pad"
              maxLength={6}
              mode="outlined"
              theme={inputTheme}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
              right={
                pincodeLoading ? <TextInput.Icon icon="loading" /> : undefined
              }
              style={[styles.input, styles.field]}
            />

            <TextInput
              label="City *"
              value={city}
              onChangeText={setCity}
              mode="outlined"
              theme={inputTheme}
              style={[styles.input, styles.field]}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
            />

            <TextInput
              label="State *"
              value={stateName}
              onChangeText={setStateName}
              mode="outlined"
              theme={inputTheme}
              style={[styles.input, styles.field]}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
            />

            <TextInput
              label="Country *"
              value={country}
              onChangeText={setCountry}
              mode="outlined"
              theme={inputTheme}
              style={[styles.input, styles.field]}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
            />

            <View style={styles.field}>
              <TouchableOpacity
                style={styles.dropdownBox}
                onPress={() => setGenderOpen(!genderOpen)}
              >
                <Text style={gender ? styles.dropdownValue : styles.placeholder}>
                  {gender || "Select Gender *"}
                </Text>
              </TouchableOpacity>

              {genderOpen &&
                genderOptions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setGender(item);
                      setGenderOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
              style={[styles.dateInput, styles.field]}
              onPress={() => setShowDobPicker(true)}
            >
              <Text
                style={dateOfBirth ? styles.dropdownValue : styles.placeholder}
              >
                {dateOfBirth || "Date of Birth *"}
              </Text>
            </TouchableOpacity>

            <TextInput
              label="Religion *"
              value={religion}
              onChangeText={setReligion}
              mode="outlined"
              theme={inputTheme}
              style={[styles.input, styles.field]}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
            />

            <TextInput
              label="Specialization *"
              value={specialization}
              onChangeText={setSpecialization}
              mode="outlined"
              theme={inputTheme}
              style={[styles.input, styles.field]}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
            />
          </View>

          {showDobPicker && (
            <DateTimePicker
              value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
              mode="date"
              maximumDate={new Date()}
              onChange={(_, selectedDate) => {
                setShowDobPicker(false);

                if (selectedDate) {
                  setDateOfBirth(selectedDate.toISOString().slice(0, 10));
                }
              }}
            />
          )}

          <TextInput
            label="Full Address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            mode="outlined"
            theme={inputTheme}
            style={styles.multilineInput}
            outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
          />

          <View style={styles.languageRow}>
            <TextInput
              label="Add language"
              value={languageInput}
              onChangeText={setLanguageInput}
              mode="outlined"
              theme={inputTheme}
              style={[styles.input, styles.languageInput]}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
            />

            <Button mode="outlined" onPress={addLanguage}>
              Add
            </Button>
          </View>

          <View style={styles.chips}>
            {languagesKnown.map((item) => (
              <Chip
                key={item}
                onClose={() =>
                  setLanguagesKnown(
                    languagesKnown.filter((value) => value !== item)
                  )
                }
              >
                {item}
              </Chip>
            ))}
          </View>

          <CheckGroup
            title="Consultation Modes"
            options={consultationModeOptions}
            selected={consultationModes}
            onToggle={(value) =>
              toggleValue(value, consultationModes, setConsultationModes)
            }
          />

          <CheckGroup
            title="Expertise"
            options={expertiseOptions}
            selected={expertise}
            onToggle={(value) => toggleValue(value, expertise, setExpertise)}
          />

          <TextInput
            label="About Yourself"
            value={aboutYourself}
            onChangeText={setAboutYourself}
            multiline
            numberOfLines={5}
            mode="outlined"
            theme={inputTheme}
            style={styles.aboutInput}
            outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
          />

          <Actions backDisabled onContinue={continueStep} />
        </View>
      );
    }

    if (step === 2) {
      return (
        <View style={styles.section}>
          <SectionHeader
            stepLabel="Step 2 of 4"
            title="Identity Verification"
            description="Add Aadhaar number and upload Aadhaar document."
          />

          <View style={styles.twoColumns}>
            <TextInput
              label="Aadhaar Number *"
              value={aadhaarNo}
              onChangeText={(value) =>
                setAadhaarNo(value.replace(/\D/g, "").slice(0, 12))
              }
              keyboardType="number-pad"
              maxLength={12}
              mode="outlined"
              theme={inputTheme}
              style={[styles.input, styles.field]}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
            />

            <UploadCard
              title="Aadhaar Upload"
              file={aadhaarFile}
              onPick={() => pickDocument(setAadhaarFile)}
            />
          </View>

          <Actions onBack={() => setStep(1)} onContinue={continueStep} />
        </View>
      );
    }

    if (step === 3) {
      return (
        <View style={styles.section}>
          <SectionHeader
            stepLabel="Step 3 of 4"
            title="Education & Certification"
            description="Upload education, certificate, experience, and profile photo."
          />

          <View style={styles.twoColumns}>
            <TextInput
              label="Educational Qualification *"
              value={educationalQualification}
              onChangeText={setEducationalQualification}
              mode="outlined"
              theme={inputTheme}
              style={[styles.input, styles.field]}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
            />

            <TextInput
              label="Years of Experience *"
              value={yearsOfExperience}
              onChangeText={(value) =>
                setYearsOfExperience(value.replace(/[^0-9.]/g, "").slice(0, 4))
              }
              keyboardType="decimal-pad"
              mode="outlined"
              theme={inputTheme}
              style={[styles.input, styles.field]}
              outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
            />

            <UploadCard
              title="Higher Education Degree / Diploma"
              file={educationDoc}
              onPick={() => pickDocument(setEducationDoc)}
            />

            <UploadCard
              title="Certificate Documents"
              file={certificateDoc}
              onPick={() => pickDocument(setCertificateDoc)}
            />

            <UploadCard
              title="Experience Letter"
              file={experienceLetter}
              onPick={() => pickDocument(setExperienceLetter)}
            />

            <UploadCard
              title="Profile Photo"
              file={profilePhoto}
              image
              onPick={() => pickImage(setProfilePhoto)}
            />
          </View>

          <Actions onBack={() => setStep(2)} onContinue={continueStep} />
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <SectionHeader
          stepLabel="Step 4 of 4"
          title="Declaration"
          description="Accept declaration and submit your application."
        />

        <View style={styles.declarationBox}>
          <Checkbox.Item
            label={declarationText}
            status={declarationAccepted ? "checked" : "unchecked"}
            onPress={() => setDeclarationAccepted((value) => !value)}
            labelStyle={styles.declarationText}
          />
        </View>

        <View style={styles.twoColumns}>
          <TextInput
            label="Full Name as Digital Signature *"
            value={digitalSignature}
            onChangeText={setDigitalSignature}
            mode="outlined"
            theme={inputTheme}
            style={[styles.input, styles.field]}
            outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
          />

          <TouchableOpacity
            style={[styles.dateInput, styles.field]}
            onPress={() => setShowDeclarationDate(true)}
          >
            <Text
              style={
                declarationDate ? styles.dropdownValue : styles.placeholder
              }
            >
              {declarationDate || "Declaration Date *"}
            </Text>
          </TouchableOpacity>
        </View>

        {showDeclarationDate && (
          <DateTimePicker
            value={declarationDate ? new Date(declarationDate) : new Date()}
            mode="date"
            maximumDate={new Date()}
            onChange={(_, selectedDate) => {
              setShowDeclarationDate(false);

              if (selectedDate) {
                setDeclarationDate(selectedDate.toISOString().slice(0, 10));
              }
            }}
          />
        )}

        <Actions
          onBack={() => setStep(3)}
          submit
          loading={submitting}
          onContinue={submit}
        />
      </View>
    );
  }

}

function StepIndicator({ activeStep }: { activeStep: number }) {
  return (
    <View style={styles.stepRow}>
      {stepLabels.map((item, index) => {
        const active = activeStep >= index;

        return (
          <View key={item} style={styles.stepWrap}>
            <View style={[styles.stepCircle, active && styles.activeCircle]}>
              <Text style={[styles.stepText, active && styles.activeStepText]}>
                {index + 1}
              </Text>
            </View>

            <Text style={styles.stepSmallText}>{item}</Text>

            {index !== stepLabels.length - 1 && (
              <View style={[styles.stepLine, active && styles.activeLine]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

function SectionHeader({
  stepLabel,
  title,
  description,
}: {
  stepLabel: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.stepLabel}>{stepLabel}</Text>
      <Text variant="titleLarge" style={styles.sectionTitle}>
        {title}
      </Text>
      <Text style={styles.muted}>{description}</Text>
    </View>
  );
}

function Actions({
  onBack,
  onContinue,
  backDisabled,
  submit,
  loading,
}: {
  onBack?: () => void;
  onContinue: () => void;
  backDisabled?: boolean;
  submit?: boolean;
  loading?: boolean;
}) {
  return (
    <View style={styles.actions}>
      <Button mode="outlined" disabled={backDisabled} onPress={onBack}>
        Back
      </Button>

      <Button
        mode="contained"
        loading={loading}
        onPress={onContinue}
        style={styles.primaryBtn}
        labelStyle={styles.primaryBtnText}
      >
        {submit ? "Submit Application" : "Continue"}
      </Button>
    </View>
  );
}

function UploadCard({
  title,
  file,
  onPick,
  image,
}: {
  title: string;
  file: any;
  onPick: () => void;
  image?: boolean;
}) {
  return (
    <View style={styles.uploadCard}>
      <Text style={styles.uploadTitle}>{title}</Text>

      <Button
        mode="outlined"
        icon={image ? "image" : "paperclip"}
        onPress={onPick}
      >
        {file ? "Change File" : "Choose File"}
      </Button>

      <Text style={styles.muted}>Allowed formats: JPG, PNG, PDF.</Text>

      {file?.name || file?.fileName ? (
        <Text style={styles.fileName}>{file.name || file.fileName}</Text>
      ) : null}
    </View>
  );
}

function CheckGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View style={styles.checkGroup}>
      <Text style={styles.uploadTitle}>{title}</Text>

      <View style={styles.checkGrid}>
        {options.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.checkItem,
              selected.includes(item) && styles.activeCheckItem,
            ]}
            onPress={() => onToggle(item)}
          >
            <Checkbox
              status={selected.includes(item) ? "checked" : "unchecked"}
            />
            <Text style={styles.checkText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
  flex: 1,
  backgroundColor: "#fff",
},

  content: {
  flexGrow: 1,
  padding: spacing.lg,
  gap: spacing.md,
  paddingBottom: 24,
},

  topCard: {
    borderRadius: 12,
    backgroundColor: "#fffaf0",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#ead27a",
    gap: spacing.xs,
  },

  kicker: {
    color: "#b94717",
    fontSize: 12,
    fontWeight: "900",
  },

  mainTitle: {
    color: colors.ink,
    fontWeight: "900",
  },

  muted: {
    color: colors.cocoa,
    lineHeight: 20,
    fontSize: 13,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: "#fffaf0",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ead27a",
  },

  stepWrap: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },

  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d8c98a",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  activeCircle: {
    backgroundColor: "#b6f000",
    borderColor: "#b6f000",
  },

  stepText: {
    fontWeight: "800",
    color: "#555",
  },

  activeStepText: {
    color: "#111",
  },

  stepSmallText: {
    marginTop: 6,
    fontSize: 10,
    color: "#6b5b2e",
    textAlign: "center",
  },

  stepLine: {
    position: "absolute",
    top: 16,
    left: "55%",
    right: "-45%",
    height: 2,
    backgroundColor: "#e2d6a4",
    zIndex: 1,
  },

  activeLine: {
    backgroundColor: "#b6f000",
  },

  formPanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ead27a",
    backgroundColor: "#fffaf0",
    padding: spacing.md,
  },

  section: {
    gap: spacing.md,
  },

  sectionHeader: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0dda1",
    backgroundColor: "#fffdf8",
    padding: spacing.md,
    gap: spacing.xs,
  },

  stepLabel: {
    color: "#b94717",
    fontWeight: "900",
  },

  sectionTitle: {
    color: colors.ink,
    fontWeight: "900",
  },

  input: {
    backgroundColor: "transparent",
  },

  twoColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  field: {
    flexGrow: 1,
    flexBasis: 260,
  },

  dropdownBox: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#d8c98a",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: "transparent",
  },

  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#ead27a",
    backgroundColor: "#fffdf7",
  },

  dropdownItemText: {
    color: "#111",
  },

  dateInput: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#d8c98a",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: "transparent",
  },

  placeholder: {
    color: "#777",
  },

  dropdownValue: {
    color: "#111",
    fontWeight: "600",
  },

  multilineInput: {
    backgroundColor: "transparent",
    minHeight: 95,
  },

  aboutInput: {
    backgroundColor: "transparent",
    minHeight: 130,
  },

  languageRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },

  languageInput: {
    flex: 1,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  checkGroup: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0dda1",
    padding: spacing.sm,
    gap: spacing.sm,
    backgroundColor: "#fffdf8",
  },

  checkGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  checkItem: {
    width: "31%",
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ead27a",
    backgroundColor: "#fffdf7",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 6,
  },

  activeCheckItem: {
    borderColor: "#b6f000",
    backgroundColor: "#f8ffe7",
  },

  checkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#2a220d",
  },

  uploadCard: {
    flexGrow: 1,
    flexBasis: 260,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ead27a",
    padding: 14,
    gap: 8,
    backgroundColor: "#fffdf7",
  },

  uploadTitle: {
    color: colors.ink,
    fontWeight: "900",
  },

  fileName: {
    fontSize: 12,
    color: "#6b5b2e",
    fontWeight: "700",
  },

  declarationBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ead27a",
    backgroundColor: "#fffdf7",
  },

  declarationText: {
    fontSize: 13,
    color: "#2a220d",
  },

  actions: {
    borderTopWidth: 1,
    borderTopColor: "#f0dda1",
    paddingTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  primaryBtn: {
    borderRadius: 14,
    backgroundColor: "#b6f000",
  },

  primaryBtnText: {
    color: "#111",
    fontWeight: "900",
  },

  errorSnack: {
    backgroundColor: colors.danger,
  },
});
