import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Checkbox, Dialog, Portal, Snackbar, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { colors, spacing } from "@/constants/theme";
import { OtpVerificationDialog } from "@/components/OtpVerificationDialog";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import {
  initiateClientSignup,
  processAstrologerRegistrationOtp,
  registerAstrologer,
  registerClient
} from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

type Step = 1 | 2;
type UploadAsset = {
  uri?: string;
  name?: string;
  fileName?: string | null;
  mimeType?: string;
  type?: string | null;
  size?: number;
  fileSize?: number;
};

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const documentTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const imageTypes = ["image/jpeg", "image/jpg", "image/png"];
const expertiseOptions = ["Astrology", "Numerology", "Vastu", "Palmistry", "Graphology", "Reiki", "Tarot"];
const consultationModeOptions = ["Chat", "Call", "Video"];
const genderOptions = ["Male", "Female", "Other"];
const minimumRegistrationBirthDate = new Date(1950, 0, 1);

export function RegisterScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  return params.type === "client" ? <ClientRegisterScreen /> : <AstrologerRegisterScreen />;
}

function AstrologerRegisterScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [verificationChannel, setVerificationChannel] = useState<"email" | "mobileNo">("email");
  const [registeredPublicId, setRegisteredPublicId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const successRedirect = useLoginSuccessRedirect({ pathname: "/(auth)/login", params: { mode: "astrologer" } });

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [gender, setGender] = useState("");
  const [genderOpen, setGenderOpen] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [religion, setReligion] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("India");
  const [languageInput, setLanguageInput] = useState("");
  const [languagesKnown, setLanguagesKnown] = useState<string[]>([]);
  const [consultationModes, setConsultationModes] = useState<string[]>([]);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [aboutYourself, setAboutYourself] = useState("");

  const [educationalQualification, setEducationalQualification] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [educationDoc, setEducationDoc] = useState<UploadAsset | null>(null);
  const [certificateDocs, setCertificateDocs] = useState<UploadAsset[]>([]);
  const [experienceDocs, setExperienceDocs] = useState<UploadAsset[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<UploadAsset | null>(null);

  const progress = step === 1 ? 50 : 100;
  const stepTitle = step === 1 ? "Personal Information" : "Education & Certification";
  const stepDescription =
    step === 1
      ? "Profile basics, expertise, languages, and consultation modes."
      : "Higher education, certificates, experience letter, and profile photo.";

  const inputTheme = useMemo(
    () => ({
      colors: { background: "#fffaf0", primary: "#b6f000", outline: "#ead27a" }
    }),
    []
  );

  const showMessage = (text: string) => {
    setError("");
    setMessage(text);
  };

  const showError = (text: string) => {
    setMessage("");
    setError(text);
  };

  const changeEmail = (value: string) => {
    setEmail(value);
    setEmailVerified(false);
    setRegisteredPublicId("");
  };

  const changeMobile = (value: string) => {
    setMobileNo(value.replace(/\D/g, "").slice(0, 10));
    setMobileVerified(false);
    setRegisteredPublicId("");
  };

  const lookupPincode = async (value: string) => {
    const next = value.replace(/\D/g, "").slice(0, 6);
    setPincode(next);
    if (next.length !== 6) return;

    try {
      setPincodeLoading(true);
      const response = await fetch(`https://api.postalpincode.in/pincode/${next}`);
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

  const toggleValue = (value: string, list: string[], setList: (items: string[]) => void) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const sendOtp = async (channel: "email" | "mobileNo" = verificationChannel) => {
    if (channel === "email" && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      showError("Enter a valid email address.");
      return;
    }
    if (channel === "mobileNo" && !/^\d{10}$/.test(mobileNo.trim())) {
      showError("Mobile number must be 10 digits.");
      return;
    }

    try {
      setOtpSending(true);
      setVerificationChannel(channel);
      setOtp("");
      await processAstrologerRegistrationOtp({
        step: "generate",
        channel,
        email: channel === "email" ? email.trim() : "",
        mobileNo: channel === "mobileNo" ? mobileNo.trim() : ""
      });
      setOtpOpen(true);
      showMessage(channel === "email" ? "OTP sent to your email." : "OTP sent to your mobile number.");
    } catch (err) {
      showError(getApiErrorMessage(err, "Unable to send OTP"));
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      showError("Enter the 6 digit OTP.");
      return;
    }

    try {
      setOtpVerifying(true);
      await processAstrologerRegistrationOtp({
        step: "validate",
        channel: verificationChannel,
        email: verificationChannel === "email" ? email.trim() : "",
        mobileNo: verificationChannel === "mobileNo" ? mobileNo.trim() : "",
        otp
      });
      if (verificationChannel === "email") setEmailVerified(true);
      else setMobileVerified(true);
      setOtpOpen(false);
      setOtp("");
      showMessage(verificationChannel === "email" ? "Email verified." : "Mobile number verified.");
    } catch (err) {
      showError(getApiErrorMessage(err, "OTP verification failed"));
    } finally {
      setOtpVerifying(false);
    }
  };

  const validateBasic = () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email address.";
    if (!emailVerified || !mobileVerified) return "Please verify both your email and mobile number first.";
    if (!fullName.trim()) return "Full name is required.";
    if (!displayName.trim()) return "Display name is required.";
    if (!gender.trim()) return "Gender is required.";
    if (!dateOfBirth.trim()) return "Date of birth is required.";
    if (!isValidRegistrationBirthDate(dateOfBirth)) return "Date of birth must be between 1950 and today.";
    if (!religion.trim()) return "Religion is required.";
    if (!specialization.trim()) return "Specialization is required.";
    if (!address.trim()) return "Full address is required.";
    if (!/^[0-9]{6}$/.test(pincode)) return "Pincode must be 6 digits.";
    if (!city.trim()) return "City is required.";
    if (!stateName.trim()) return "State is required.";
    if (!country.trim()) return "Country is required.";
    if (!languagesKnown.length) return "At least one language is required.";
    if (!consultationModes.length) return "Select at least one consultation mode.";
    if (!expertise.length) return "Select at least one specialization option.";
    return "";
  };

  const validateDocuments = () => {
    if (!educationalQualification.trim()) return "Educational qualification is required.";
    if (!yearsOfExperience.trim()) return "Years of experience is required.";
    return "";
  };

  const getTotalUploadSize = () =>
    [educationDoc, profilePhoto, ...certificateDocs, ...experienceDocs].reduce(
      (total, file) => total + (file?.size || file?.fileSize || 0),
      0
    );

  const getPayload = (payloadStep: "basic" | "document") => ({
    publicId: registeredPublicId,
    fullName,
    mobileNo,
    email,
    gender,
    dateOfBirth,
    address,
    pinCode: pincode,
    city,
    state: stateName,
    country,
    languagesKnown,
    religion,
    specialization,
    displayName,
    expertise,
    consultationModes,
    aboutYourself,
    yearsOfExperience,
    educationalQualification,
    aadhaarNo: "null",
    step: payloadStep,
    documents: {
      educationalQualificationFile: educationDoc,
      certificateFiles: certificateDocs,
      experienceFiles: experienceDocs,
      profileImageFile: profilePhoto
    }
  });

  const submitBasic = async () => {
    const validationError = validateBasic();
    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      const response = await registerAstrologer(getPayload("basic"));
      const publicId = extractPublicId(response);
      if (publicId) setRegisteredPublicId(publicId);
      setStep(2);
      showMessage("Basic profile saved. Please upload documents.");
    } catch (err) {
      showError(getApiErrorMessage(err, "Unable to save basic profile"));
    } finally {
      setSubmitting(false);
    }
  };

  const submitDocuments = async () => {
    const validationError = validateDocuments();
    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      console.log("[auth.registerAstrologer] total upload size", {
        bytes: getTotalUploadSize(),
        mb: Number((getTotalUploadSize() / (1024 * 1024)).toFixed(2))
      });
      await registerAstrologer(getPayload("document"));
      successRedirect.open();
    } catch (err) {
      showError(getApiErrorMessage(err, "Registration failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const validateUpload = (file: UploadAsset, allowedTypes: string[]) => {
    const size = file.size || file.fileSize || 0;
    const mimeType = normalizeUploadMimeType(file);

    if (size > MAX_UPLOAD_BYTES) {
      showError("Upload file size must be up to 3 MB.");
      return false;
    }

    if (!allowedTypes.includes(mimeType)) {
      showError(
        allowedTypes.includes("application/pdf")
          ? "Allowed formats are JPG, JPEG, PNG and PDF."
          : "Profile picture must be JPG, JPEG or PNG."
      );
      return false;
    }

    return true;
  };

  const pickDocuments = async (setter: (files: UploadAsset[]) => void, current: UploadAsset[], maxFiles: number) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: documentTypes,
      copyToCacheDirectory: true,
      multiple: true
    });

    if (result.canceled) return;
    const assets = result.assets.filter((asset) => validateUpload(asset, documentTypes));
    setter([...current, ...assets].slice(0, maxFiles));
  };

  const pickSingleDocument = async (setter: (file: UploadAsset | null) => void) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: documentTypes,
      copyToCacheDirectory: true
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (validateUpload(asset, documentTypes)) setter(asset);
  };

  const pickProfilePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError("Please allow gallery permission.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (validateUpload(asset, imageTypes)) setProfilePhoto(asset);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        extraScrollHeight={30}
        extraHeight={120}
      >
        <View style={styles.topCard}>
          <Text style={styles.kicker}>{t("SIGN UP AS ASTROLOGER")}</Text>
          <Button mode="outlined" compact onPress={() => router.back()} style={styles.backOption}>
            {t("Back to registration options")}
          </Button>
          <Text variant="headlineSmall" style={styles.mainTitle}>
            {t("Complete your verification profile with confidence.")}
          </Text>
          <Text style={styles.muted}>
            {t("Share your profile and optional documents in one compact application flow.")}
          </Text>
        </View>

        <StepTabs step={step} progress={progress} title={stepTitle} />

        <View style={styles.formPanel}>
          <SectionHeader stepLabel={`Step ${step} of 2`} title={stepTitle} description={stepDescription} />
          {step === 1 ? renderBasicStep() : renderDocumentStep()}
        </View>
      </KeyboardAwareScrollView>

      <Portal>
        <OtpVerificationDialog
          visible={otpOpen}
          recipient={verificationChannel === "email" ? email.trim() : mobileNo.trim()}
          value={otp}
          onChange={setOtp}
          loading={otpVerifying}
          resendLoading={otpSending}
          onResend={() => sendOtp(verificationChannel)}
          onCancel={() => { setOtpOpen(false); setOtp(""); }}
          onSubmit={verifyOtp}
        />
        <RegistrationSuccessDialog
          visible={successRedirect.visible}
          countdown={successRedirect.countdown}
          onLogin={successRedirect.goToLogin}
        />
      </Portal>

      <Snackbar visible={!!message} onDismiss={() => setMessage("")} duration={3500}>
        {t(message)}
      </Snackbar>
      <Snackbar visible={!!error} onDismiss={() => setError("")} duration={4500} style={styles.errorSnack}>
        {t(error)}
      </Snackbar>
    </SafeAreaView>
  );

  function renderBasicStep() {
    const basicFieldsDisabled = !emailVerified || !mobileVerified;

    return (
      <View style={styles.section}>
        <View style={styles.emailRow}>
          <TextInput
            label={t("Email Address *")}
            value={email}
            onChangeText={changeEmail}
            disabled={emailVerified || otpOpen || otpSending || otpVerifying}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
            theme={inputTheme}
            style={[styles.input, styles.emailInput]}
            right={emailVerified ? <TextInput.Icon icon="check-circle" color={colors.success} /> : undefined}
          />
          <Button
            mode="contained"
            loading={otpSending && verificationChannel === "email"}
            disabled={emailVerified || otpSending || otpVerifying}
            onPress={() => sendOtp("email")}
            style={styles.verifyBtn}
            labelStyle={styles.verifyBtnText}
          >
            {emailVerified ? t("Verified") : t("Verify")}
          </Button>
        </View>
        {emailVerified ? <Text style={styles.successText}>{t("Email verified")}</Text> : null}

        <View style={styles.emailRow}>
          <TextInput
            label={t("Mobile Number *")}
            value={mobileNo}
            onChangeText={changeMobile}
            disabled={mobileVerified || otpOpen || otpSending || otpVerifying}
            keyboardType="phone-pad"
            maxLength={10}
            mode="outlined"
            theme={inputTheme}
            style={[styles.input, styles.emailInput]}
            right={mobileVerified ? <TextInput.Icon icon="check-circle" color={colors.success} /> : undefined}
          />
          <Button
            mode="contained"
            loading={otpSending && verificationChannel === "mobileNo"}
            disabled={mobileVerified || otpSending || otpVerifying}
            onPress={() => sendOtp("mobileNo")}
            style={styles.verifyBtn}
            labelStyle={styles.verifyBtnText}
          >
            {mobileVerified ? t("Verified") : t("Verify")}
          </Button>
        </View>
        {mobileVerified ? <Text style={styles.successText}>{t("Mobile number verified")}</Text> : null}

        <View style={styles.twoColumns}>
          <AppInput t={t} inputTheme={inputTheme} disabled={basicFieldsDisabled} label="Full Name *" value={fullName} onChangeText={setFullName} />
          <AppInput t={t} inputTheme={inputTheme} disabled={basicFieldsDisabled} label="Display Name *" value={displayName} onChangeText={setDisplayName} />
          <View style={styles.field}>
            <TouchableOpacity
              disabled={basicFieldsDisabled}
              style={[styles.dropdownBox, basicFieldsDisabled && styles.disabledBox]}
              onPress={() => setGenderOpen(!genderOpen)}
            >
              <Text style={gender ? styles.dropdownValue : styles.placeholder}>
                {gender ? t(gender) : t("Select Gender *")}
              </Text>
            </TouchableOpacity>
            {genderOpen && !basicFieldsDisabled
              ? genderOptions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setGender(item);
                      setGenderOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{t(item)}</Text>
                  </TouchableOpacity>
                ))
              : null}
          </View>
          <DatePickerField
            disabled={basicFieldsDisabled}
            label="Date of Birth"
            placeholder="Select birth date"
            value={formatDisplayBirthDate(dateOfBirth)}
            onPress={() => setShowDobPicker(true)}
          />
          {/* <TouchableOpacity
            disabled={basicFieldsDisabled}
            style={[styles.dateInput, styles.field, basicFieldsDisabled && styles.disabledBox]}
            onPress={() => setShowDobPicker(true)}
          >
            <Text style={dateOfBirth ? styles.dropdownValue : styles.placeholder}>
              {dateOfBirth || t("Date of Birth *")}
            </Text>
          </TouchableOpacity> */}
          <AppInput t={t} inputTheme={inputTheme} disabled={basicFieldsDisabled} label="Religion *" value={religion} onChangeText={setReligion} />
          <AppInput t={t} inputTheme={inputTheme} disabled={basicFieldsDisabled} label="Specialization *" value={specialization} onChangeText={setSpecialization} />
          <AppInput
            t={t}
            inputTheme={inputTheme}
            disabled={basicFieldsDisabled}
            label="Pincode *"
            value={pincode}
            onChangeText={lookupPincode}
            keyboardType="number-pad"
            right={pincodeLoading ? <TextInput.Icon icon="loading" /> : undefined}
            maxLength={6}
          />
          <AppInput t={t} inputTheme={inputTheme} disabled={basicFieldsDisabled} label="City *" value={city} onChangeText={setCity} />
          <AppInput t={t} inputTheme={inputTheme} disabled={basicFieldsDisabled} label="State *" value={stateName} onChangeText={setStateName} />
          <AppInput t={t} inputTheme={inputTheme} disabled={basicFieldsDisabled} label="Country *" value={country} onChangeText={setCountry} />
        </View>

        {showDobPicker && !basicFieldsDisabled ? (
          <DateTimePicker
            value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
            mode="date"
            minimumDate={minimumRegistrationBirthDate}
            maximumDate={new Date()}
            onChange={(_, selectedDate) => {
              setShowDobPicker(false);
              if (selectedDate) setDateOfBirth(selectedDate.toISOString().slice(0, 10));
            }}
          />
        ) : null}

        <TextInput
          label={t("Full Address *")}
          value={address}
          onChangeText={setAddress}
          disabled={basicFieldsDisabled}
          multiline
          numberOfLines={3}
          mode="outlined"
          theme={inputTheme}
          style={styles.multilineInput}
        />

        <View style={styles.languageRow}>
          <TextInput
            label={t("Add language and press Add")}
            value={languageInput}
            onChangeText={setLanguageInput}
            disabled={basicFieldsDisabled}
            mode="outlined"
            theme={inputTheme}
            style={[styles.input, styles.languageInput]}
          />
          <Button mode="outlined" disabled={basicFieldsDisabled} onPress={addLanguage}>
            {t("Add")}
          </Button>
        </View>
        <View style={styles.chips}>
          {languagesKnown.map((item) => (
            <Button
              key={item}
              mode="outlined"
              compact
              disabled={basicFieldsDisabled}
              onPress={() => setLanguagesKnown(languagesKnown.filter((value) => value !== item))}
            >
              {item}
            </Button>
          ))}
        </View>

        <CheckGroup
          title="Consultation Modes"
          options={consultationModeOptions}
          selected={consultationModes}
          disabled={basicFieldsDisabled}
          onToggle={(value) => toggleValue(value, consultationModes, setConsultationModes)}
        />
        <CheckGroup
          title="Specialization"
          options={expertiseOptions}
          selected={expertise}
          disabled={basicFieldsDisabled}
          onToggle={(value) => toggleValue(value, expertise, setExpertise)}
        />

        <TextInput
          label={t("About Yourself")}
          value={aboutYourself}
          onChangeText={setAboutYourself}
          disabled={basicFieldsDisabled}
          multiline
          numberOfLines={5}
          mode="outlined"
          theme={inputTheme}
          style={styles.aboutInput}
        />

        <Actions backDisabled continueDisabled={basicFieldsDisabled} onContinue={submitBasic} loading={submitting} />
      </View>
    );
  }

  function renderDocumentStep() {
    return (
      <View style={styles.section}>
        <View style={styles.twoColumns}>
          <AppInput t={t} inputTheme={inputTheme} label="Educational Qualification *" value={educationalQualification} onChangeText={setEducationalQualification} />
          <AppInput
            t={t}
            inputTheme={inputTheme}
            label="Years of Experience *"
            value={yearsOfExperience}
            onChangeText={(value) => setYearsOfExperience(value.replace(/[^0-9.]/g, "").slice(0, 4))}
            keyboardType="decimal-pad"
          />
        </View>

        <UploadCard
          title="Higher Education Degree / Diploma Upload (Optional)"
          files={educationDoc ? [educationDoc] : []}
          onPick={() => pickSingleDocument(setEducationDoc)}
          onRemove={() => setEducationDoc(null)}
        />
        <UploadCard
          title="Certificate Documents (Optional, up to 3)"
          files={certificateDocs}
          onPick={() => pickDocuments(setCertificateDocs, certificateDocs, 3)}
          onRemove={(index) => setCertificateDocs(certificateDocs.filter((_, itemIndex) => itemIndex !== index))}
          multiple
        />
        <UploadCard
          title="Experience Letter (Optional, up to 5)"
          files={experienceDocs}
          onPick={() => pickDocuments(setExperienceDocs, experienceDocs, 5)}
          onRemove={(index) => setExperienceDocs(experienceDocs.filter((_, itemIndex) => itemIndex !== index))}
          multiple
        />
        <UploadCard
          title="Passport Size Photo (Optional)"
          files={profilePhoto ? [profilePhoto] : []}
          onPick={pickProfilePhoto}
          onRemove={() => setProfilePhoto(null)}
          photoOnly
        />

        <Actions onBack={() => setStep(1)} onContinue={submitDocuments} submit loading={submitting} />
      </View>
    );
  }
}

function extractPublicId(response: unknown) {
  const value = response as {
    publicId?: string;
    data?: { publicId?: string; astrologer?: { publicId?: string } };
  };
  return value.publicId || value.data?.publicId || value.data?.astrologer?.publicId || "";
}

function ClientRegisterScreen() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [signupChannel, setSignupChannel] = useState<"email" | "mobileNo">("email");
  const [mobileNo, setMobileNo] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const acceptSignupSession = useAuthStore((state) => state.acceptSignupSession);

  const inputTheme = useMemo(
    () => ({
      colors: { background: "#fffaf0", primary: "#b6f000", outline: "#ead27a" }
    }),
    []
  );

  const showError = (text: string) => {
    setMessage("");
    setError(text);
  };

  const getPayload = (nextOtp: string) => ({
    username: signupChannel === "email" ? email : mobileNo,
    channel: signupChannel,
    password: signupChannel === "email" ? password : "",
    otp: nextOtp,
    firstName,
    lastName,
    phone: signupChannel === "mobileNo" ? mobileNo : "",
    gender: "",
    dateOfBirth: "",
    placeOfBirth: ""
  });

  const validate = () => {
    if (!firstName.trim()) return "First name is required.";
    if (!lastName.trim()) return "Last name is required.";
    if (signupChannel === "email" && !/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email address.";
    if (signupChannel === "mobileNo" && !/^[0-9]{10}$/.test(mobileNo.trim())) return "Mobile number must be 10 digits.";
    if (signupChannel === "email" && !isStrongClientPassword(password)) return "Password must start with a capital letter and include a number and special character.";
    if (!captchaChecked) return "Please confirm I'm not a robot.";
    return "";
  };

  const sendOtp = async () => {
    const validationError = validate();
    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      await initiateClientSignup(getPayload(""));
      setOtpOpen(true);
      setError("");
      setMessage("OTP sent successfully.");
    } catch (err) {
      showError(getApiErrorMessage(err, "Unable to send OTP"));
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      showError("Enter the 6 digit OTP.");
      return;
    }

    try {
      setVerifying(true);
      const result = await registerClient(getPayload(otp));
      setOtpOpen(false);
      if (result.accessToken) {
        await acceptSignupSession(result.accessToken, result.claims, {
          firstName,
          lastName,
          email: signupChannel === "email" ? email.trim() : "",
          mobileNo: signupChannel === "mobileNo" ? mobileNo : "",
          phone: signupChannel === "mobileNo" ? mobileNo : ""
        });
        router.replace("/astrologer");
      } else showError("Account created, but no access token was returned. Please log in.");
    } catch (err) {
      showError(getApiErrorMessage(err, "OTP verification failed"));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.clientRoot} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.clientContent}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.clientCard}>
          <View style={styles.clientHero}>
            <Text style={styles.kicker}>{t("CLIENT SIGNUP")}</Text>
            <Text variant="headlineSmall" style={styles.mainTitle}>
              {t("Welcome ApsraAstro")}
            </Text>
            <Text style={styles.muted}>{t("Create your account and start your journey.")}</Text>
            <View style={styles.channelChoices}>
              <Pressable accessibilityRole="button" onPress={() => setSignupChannel("email")} style={[styles.channelChoice, signupChannel === "email" && styles.channelChoiceActive]}>
                <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.channelChoiceText, signupChannel === "email" && styles.channelChoiceTextActive]}>{t("Signup with email")}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setSignupChannel("mobileNo")} style={[styles.channelChoice, signupChannel === "mobileNo" && styles.channelChoiceActive]}>
                <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.channelChoiceText, signupChannel === "mobileNo" && styles.channelChoiceTextActive]}>{t("Signup with Mobile")}</Text>
              </Pressable>
            </View>
            <Button
              mode="outlined"
              style={styles.changeTypeBtn}
              labelStyle={styles.primaryBtnText}
              onPress={() => router.replace({ pathname: "/(auth)/register", params: { type: "astrologer" } })}
            >
              {t("Change type")}
            </Button>
          </View>

          <View style={styles.clientForm}>
            <ClientInput label="Enter Your First Name *" value={firstName} onChangeText={setFirstName} theme={inputTheme} />
            <ClientInput label="Enter Your Last Name *" value={lastName} onChangeText={setLastName} theme={inputTheme} />
            {signupChannel === "email" ? <ClientInput
              label="Enter Your Email *"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              theme={inputTheme}
            /> : <ClientInput
              label="Enter Your Mobile Number *"
              value={mobileNo}
              onChangeText={(value: string) => setMobileNo(value.replace(/\D/g, "").slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
              theme={inputTheme}
            />}
            {signupChannel === "email" ? <ClientInput
              label="Create Your Password *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secure}
              theme={inputTheme}
              right={<TextInput.Icon icon={secure ? "eye" : "eye-off"} onPress={() => setSecure((value) => !value)} />}
            /> : null}
            {signupChannel === "email" ? <Text style={styles.muted}>{t("First letter capital, include a number and special character. Example: Apsra@123")}</Text> : null}

            <TouchableOpacity style={styles.captchaBox} onPress={() => setCaptchaChecked((value) => !value)}>
              <Checkbox status={captchaChecked ? "checked" : "unchecked"} />
              <Text style={styles.dropdownValue}>{t("I'm not a robot")}</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{t(error)}</Text> : null}

            <Button
              mode="contained"
              loading={submitting}
              disabled={submitting}
              onPress={sendOtp}
              style={styles.primaryBtn}
              labelStyle={styles.primaryBtnText}
            >
              {t("Send OTP")}
            </Button>

            <Button mode="text" onPress={() => router.replace("/(auth)/login")}>
              {t("Already have an account? Login")}
            </Button>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <Portal>
        <OtpVerificationDialog
          visible={otpOpen}
          recipient={(signupChannel === "email" ? email : mobileNo).trim()}
          value={otp}
          onChange={setOtp}
          loading={verifying}
          onCancel={() => { setOtpOpen(false); setOtp(""); }}
          onSubmit={verifyOtp}
        />
      </Portal>

      <Snackbar visible={!!message} onDismiss={() => setMessage("")} duration={3500}>
        {t(message)}
      </Snackbar>
      <Snackbar visible={!!error} onDismiss={() => setError("")} duration={4500} style={styles.errorSnack}>
        {t(error)}
      </Snackbar>
    </SafeAreaView>
  );
}

function ClientInput(props: React.ComponentProps<typeof TextInput>) {
  const { t } = useTranslation();
  return (
    <TextInput
      {...props}
      label={typeof props.label === "string" ? t(props.label) : props.label}
      mode="outlined"
      style={[styles.input, props.style]}
      outlineStyle={{ borderRadius: 8 }}
    />
  );
}

function useLoginSuccessRedirect(target: Parameters<typeof router.replace>[0]) {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const goToLogin = () => {
    setVisible(false);
    router.replace(target);
  };

  const open = () => {
    setCountdown(3);
    setVisible(true);
  };

  useEffect(() => {
    if (!visible) return undefined;
    if (countdown <= 0) {
      goToLogin();
      return undefined;
    }

    const timer = setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, visible]);

  return { visible, countdown, open, goToLogin };
}

function RegistrationSuccessDialog({
  visible,
  countdown,
  onLogin
}: {
  visible: boolean;
  countdown: number;
  onLogin: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog visible={visible} dismissable={false} style={styles.successDialog}>
      <Dialog.Icon icon="check-circle" color={colors.success} />
      <Dialog.Title>{t("Registration Submitted Successfully")}</Dialog.Title>
      <Dialog.Content>
        <Text style={styles.muted}>
          {t("Your account registration has been submitted successfully. Please sign in to continue.")}
        </Text>
        <Text style={styles.countdownText}>
          {t("Redirecting to login in")} {countdown} {t(countdown === 1 ? "second" : "seconds")}.
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button mode="contained" onPress={onLogin} style={styles.dialogPrimaryBtn} labelStyle={styles.primaryBtnText}>
          {t("Go to Login")}
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

function AppInput({
  t,
  inputTheme,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  t: (text: string) => string;
  inputTheme: React.ComponentProps<typeof TextInput>["theme"];
}) {
  return (
    <TextInput
      {...props}
      label={typeof props.label === "string" ? t(props.label) : props.label}
      mode="outlined"
      theme={inputTheme}
      style={[styles.input, styles.field, props.style]}
    />
  );
}

function isStrongClientPassword(password: string) {
  return /^[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password) && password.length >= 6;
}

function mimeFromName(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg")) return "image/jpeg";
  if (lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

function normalizeUploadMimeType(file: UploadAsset) {
  if (file.mimeType) return file.mimeType;
  if (file.type && file.type.includes("/")) return file.type;
  return mimeFromName(file.name || file.fileName || "");
}

function formatDisplayBirthDate(value: string) {
  const date = parseRegistrationBirthDate(value);
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

function parseRegistrationBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function isValidRegistrationBirthDate(value: string) {
  const date = parseRegistrationBirthDate(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date >= minimumRegistrationBirthDate && date <= today;
}

function DatePickerField({
  disabled,
  label,
  onPress,
  placeholder,
  value
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  placeholder: string;
  value: string;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {t(label)} <Text style={styles.required}>*</Text>
      </Text>
      <TouchableOpacity
        disabled={disabled}
        style={[styles.pickerField, disabled && styles.disabledBox]}
        onPress={onPress}
      >
        <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.cocoa} style={styles.pickerIcon} />
        <Text style={[styles.pickerText, !value && styles.placeholderText]} numberOfLines={1}>
          {value || t(placeholder)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function StepTabs({ step, progress, title }: { step: Step; progress: number; title: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.stepTabs}>
      <View style={styles.stepTabsHeader}>
        <View style={styles.stepTabsCopy}>
          <Text style={styles.kicker}>{t("VERIFICATION STEPS")}</Text>
          <Text style={styles.muted}>{t("Two sections keep the application easy to complete.")}</Text>
        </View>
        <View style={styles.inlineProgress}>
          <View style={styles.inlineProgressTop}>
            <View>
              <Text style={styles.progressLabel}>{t("Application progress")}</Text>
              <Text style={styles.inlineProgressValue}>{progress}%</Text>
            </View>
            <View style={styles.inlineProgressBadge}>
              <Text style={styles.progressBadgeText}>{step}/2</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressStepText}>{t(title)}</Text>
        </View>
      </View>
      <View style={styles.tabRow}>
        <View style={[styles.tabCard, step === 1 && styles.activeTabCard]}>
          <View style={[styles.tabNumber, step === 1 && styles.activeTabNumber]}>
            <Text style={styles.tabNumberText}>01</Text>
          </View>
          <View style={styles.tabCopy}>
            <Text style={styles.tabTitle}>{t("Step 1")}</Text>
            <Text style={styles.tabText}>{t("Personal Information")}</Text>
          </View>
        </View>
        <View style={[styles.tabCard, step === 2 && styles.activeTabCard]}>
          <View style={[styles.tabNumber, step === 2 && styles.activeTabNumber]}>
            <Text style={styles.tabNumberText}>02</Text>
          </View>
          <View style={styles.tabCopy}>
            <Text style={styles.tabTitle}>{t("Step 2")}</Text>
            <Text style={styles.tabText}>{t("Education & Certification")}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({ stepLabel, title, description }: { stepLabel: string; title: string; description: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.stepLabel}>{t(stepLabel)}</Text>
      <Text variant="titleLarge" style={styles.sectionTitle} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>
        {t(title)}
      </Text>
      <Text style={styles.muted}>{t(description)}</Text>
    </View>
  );
}

function Actions({
  onBack,
  onContinue,
  backDisabled,
  continueDisabled,
  submit,
  loading
}: {
  onBack?: () => void;
  onContinue: () => void;
  backDisabled?: boolean;
  continueDisabled?: boolean;
  submit?: boolean;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.actions}>
      <Button mode="outlined" disabled={backDisabled || loading} onPress={onBack} style={styles.secondaryBtn}>
        {t("Back")}
      </Button>
      <Button mode="contained" loading={loading} disabled={loading || continueDisabled} onPress={onContinue} style={styles.primaryBtn} labelStyle={styles.primaryBtnText}>
        {submit ? t("Submit Application") : t("Continue")}
      </Button>
    </View>
  );
}

function UploadCard({
  title,
  files,
  onPick,
  onRemove,
  multiple,
  photoOnly
}: {
  title: string;
  files: UploadAsset[];
  onPick: () => void;
  onRemove: (index: number) => void;
  multiple?: boolean;
  photoOnly?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.uploadCard}>
      <Text style={styles.uploadTitle}>{t(title)}</Text>
      <View style={styles.uploadBox}>
        <Button mode="contained" icon={photoOnly ? "image" : "paperclip"} onPress={onPick} style={styles.uploadBtn}>
          {t(multiple ? "Choose files" : "Choose file")}
        </Button>
        <Text style={styles.muted}>{files.length ? `${files.length} ${t("selected")}` : t("No file chosen")}</Text>
        <Text style={styles.uploadHint}>
          {photoOnly
            ? t("Allowed formats: JPG, JPEG, PNG | Upload up to 3 MB photo")
            : t("Allowed formats: JPG, JPEG, PNG, PDF | Upload up to 3 MB file or photo")}
        </Text>
      </View>
      {files.map((file, index) => (
        <View key={`${file.uri}-${index}`} style={styles.fileRow}>
          <Text style={styles.fileName} numberOfLines={1}>
            {file.name || file.fileName || "Selected file"}
          </Text>
          <Button compact onPress={() => onRemove(index)}>
            {t("Remove")}
          </Button>
        </View>
      ))}
    </View>
  );
}

function CheckGroup({
  title,
  options,
  selected,
  disabled,
  onToggle
}: {
  title: string;
  options: string[];
  selected: string[];
  disabled?: boolean;
  onToggle: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.checkGroup}>
      <Text style={styles.uploadTitle}>{t(title)}</Text>
      <View style={styles.checkGrid}>
        {options.map((item) => (
          <TouchableOpacity
            key={item}
            disabled={disabled}
            style={[styles.checkItem, selected.includes(item) && styles.activeCheckItem, disabled && styles.disabledBox]}
            onPress={() => onToggle(item)}
          >
            <Checkbox status={selected.includes(item) ? "checked" : "unchecked"} />
            <Text style={styles.checkText}>{t(item)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff3df" },
  content: { flexGrow: 1, padding: spacing.md, gap: spacing.md, paddingBottom: 24 },
  topCard: {
    borderRadius: 8,
    backgroundColor: "#fffaf0",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#ead27a",
    gap: spacing.sm
  },
  kicker: { color: "#b94717", fontSize: 12, fontWeight: "900" },
  backOption: { alignSelf: "flex-start", borderColor: "#ead27a" },
  mainTitle: { color: colors.ink, fontWeight: "900" },
  muted: { color: colors.cocoa, lineHeight: 20, fontSize: 13 },
  progressBadgeText: { color: "#b94717", fontWeight: "900", fontSize: 16 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#fff4bd", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#e87531" },
  stepTabs: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ead27a",
    backgroundColor: "#fffaf0",
    padding: spacing.md,
    gap: spacing.sm
  },
  stepTabsHeader: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm
  },
  stepTabsCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center"
  },
  inlineProgress: {
    width: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ead27a",
    backgroundColor: "#fffdf7",
    padding: spacing.sm,
    gap: 6
  },
  inlineProgressTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  progressLabel: { color: colors.cocoa, fontSize: 10, lineHeight: 13, fontWeight: "800" },
  inlineProgressValue: { color: colors.ink, fontWeight: "900", fontSize: 20, lineHeight: 24 },
  inlineProgressBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#ead27a",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff9cb"
  },
  progressStepText: { color: colors.cocoa, fontSize: 10, lineHeight: 13, fontWeight: "700" },
  tabRow: { flexDirection: "row", gap: spacing.sm },
  tabCard: {
    flex: 1,
    minHeight: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ead27a",
    backgroundColor: "#fffdf7",
    padding: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm
  },
  activeTabCard: { borderColor: "#e87531" },
  tabNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff1bd"
  },
  activeTabNumber: { backgroundColor: "#e87531" },
  tabNumberText: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  tabCopy: { flex: 1, minWidth: 0, gap: 4 },
  tabTitle: { color: colors.ink, fontSize: 12, lineHeight: 15, fontWeight: "900" },
  tabText: { color: colors.cocoa, fontSize: 11, lineHeight: 14 },
  formPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ead27a",
    backgroundColor: "#fffaf0",
    padding: spacing.md,
    gap: spacing.md
  },
  section: { gap: spacing.md },
  sectionHeader: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f0dda1",
    backgroundColor: "#fffdf8",
    padding: spacing.md,
    gap: spacing.xs
  },
  stepLabel: { color: "#b94717", fontWeight: "900" },
  sectionTitle: { color: colors.ink, fontWeight: "900" },
  input: { backgroundColor: "transparent" },
  emailRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  emailInput: { flex: 1 },
  verifyBtn: { borderRadius: 8, backgroundColor: "#e87531" },
  verifyBtnText: { color: "#fff", fontWeight: "900" },
  successText: { color: colors.success, fontSize: 12, fontWeight: "900" },
  twoColumns: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  field: { flexGrow: 1, flexBasis: 260 },
  dropdownBox: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#d8c98a",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: "transparent"
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#ead27a",
    backgroundColor: "#fffdf7"
  },
  dropdownItemText: { color: "#111" },
  disabledBox: { opacity: 0.55 },
  fieldLabel: { color: colors.cocoa, fontSize: 11, lineHeight: 15, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" },
  required: { color: colors.danger },
  pickerField: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  pickerIcon: { marginTop: 1 },
  pickerText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: "700" },
  placeholderText: { color: colors.cocoa, fontSize: 12, fontWeight: "600" },
  dateInput: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#d8c98a",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: "transparent"
  },
  placeholder: { color: "#777" },
  dropdownValue: { color: "#111", fontWeight: "600" },
  multilineInput: { backgroundColor: "transparent", minHeight: 95 },
  aboutInput: { backgroundColor: "transparent", minHeight: 130 },
  languageRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  languageInput: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  checkGroup: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f0dda1",
    padding: spacing.sm,
    gap: spacing.sm,
    backgroundColor: "#fffdf8"
  },
  checkGrid: { gap: 8 },
  checkItem: {
    minHeight: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ead27a",
    backgroundColor: "#fffdf7",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 6
  },
  activeCheckItem: { borderColor: "#b6f000", backgroundColor: "#f8ffe7" },
  checkText: { flex: 1, fontSize: 12, fontWeight: "700", color: "#2a220d" },
  uploadCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ead27a",
    padding: 14,
    gap: 8,
    backgroundColor: "#fffdf7"
  },
  uploadTitle: { color: colors.ink, fontWeight: "900" },
  uploadBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ead27a",
    padding: spacing.sm,
    gap: 8
  },
  uploadBtn: { alignSelf: "flex-start", borderRadius: 6, backgroundColor: "#c95526" },
  uploadHint: { color: colors.cocoa, fontSize: 12, lineHeight: 17 },
  fileRow: {
    minHeight: 36,
    borderRadius: 6,
    backgroundColor: "#fff8df",
    paddingLeft: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  fileName: { flex: 1, fontSize: 12, color: "#6b5b2e", fontWeight: "700" },
  actions: {
    borderTopWidth: 1,
    borderTopColor: "#f0dda1",
    paddingTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  secondaryBtn: { flex: 1, borderRadius: 18, borderColor: "#ead27a" },
  primaryBtn: { flex: 1, borderRadius: 18, backgroundColor: "#b6f000" },
  primaryBtnText: { color: "#111", fontWeight: "900" },
  dialogPrimaryBtn: { borderRadius: 18, backgroundColor: "#b6f000" },
  clientRoot: { flex: 1, backgroundColor: "#fff3df" },
  clientContent: { flexGrow: 1, justifyContent: "center", padding: spacing.md },
  clientCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ead27a",
    backgroundColor: "#fffaf0",
    overflow: "hidden"
  },
  clientHero: {
    padding: spacing.lg,
    gap: spacing.sm
  },
  channelChoices: { flexDirection: "row", gap: 8, width: "100%" },
  channelChoice: { flex: 1, minWidth: 0, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 28, paddingHorizontal: 5, alignItems: "center", justifyContent: "center" },
  channelChoiceActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  channelChoiceText: { color: colors.cocoa, fontWeight: "700", fontSize: 13, textAlign: "center" },
  channelChoiceTextActive: { color: colors.surface },
  changeTypeBtn: {
    borderRadius: 18,
    borderColor: "#d8c98a",
    backgroundColor: "#fff9cb"
  },
  clientForm: {
    borderTopWidth: 1,
    borderTopColor: "#ead27a",
    padding: spacing.lg,
    gap: spacing.sm
  },
  captchaBox: {
    minHeight: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ead27a",
    backgroundColor: "#fffdf7",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.sm
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700"
  },
  successDialog: {
    borderRadius: 12,
    backgroundColor: "#fffdf8"
  },
  countdownText: {
    color: "#b94717",
    fontWeight: "900",
    marginTop: spacing.md
  },
  errorSnack: { backgroundColor: colors.danger }
});
