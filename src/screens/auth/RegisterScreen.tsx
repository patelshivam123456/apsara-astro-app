import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  Dialog,
  HelperText,
  Portal,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { getApiErrorMessage } from "@/services/apiClient";
import { registerAstrologer, requestOtp } from "@/services/auth.service";
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

const stepLabels = ["Account", "Personal", "Identity", "Education", "Submit"];

function OtpBoxes({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  const inputsRef = useRef<any[]>([]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, "").slice(-1);

    const otpArray = value.split("");
    otpArray[index] = digit;

    const nextOtp = otpArray.join("").slice(0, 6);
    onChange(nextOtp);

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!value[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();

        const otpArray = value.split("");
        otpArray[index - 1] = "";
        onChange(otpArray.join(""));
      }
    }
  };

  return (
    <View style={styles.otpContainer}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <TextInput
          key={index}
          ref={(ref: any) => {
            inputsRef.current[index] = ref;
          }}
          value={value[index] || ""}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          mode="outlined"
          style={styles.otpDigitInput}
          outlineStyle={styles.otpDigitOutline}
          contentStyle={styles.otpDigitContent}
          theme={{
            colors: {
              background: "#fff",
              primary: "#b6f000",
              outline: "#ead27a",
            },
          }}
        />
      ))}
    </View>
  );
}

export function RegisterScreen() {
  const [phase, setPhase] = useState<"account" | "profile">("account");
  const [step, setStep] = useState<Step>(1);
  const [emailLocked, setEmailLocked] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secure, setSecure] = useState(true);

  const [otp, setOtp] = useState("");
  const [otpDialog, setOtpDialog] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [counter, setCounter] = useState(60);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [gender, setGender] = useState("");
  const [genderOpen, setGenderOpen] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [address, setAddress] = useState("");

  const [languageInput, setLanguageInput] = useState("");
  const [languagesKnown, setLanguagesKnown] = useState<string[]>([]);
  const [consultationModes, setConsultationModes] = useState<string[]>([]);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [aboutYourself, setAboutYourself] = useState("");

  const [aadharFront, setAadharFront] = useState<any>(null);
  const [aadharBack, setAadharBack] = useState<any>(null);
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

  const activeStepNumber = phase === "account" ? 0 : step;

  const stepTitle = useMemo(() => {
    if (phase === "account") return "Account Setup";
    if (step === 1) return "Personal & Professional Information";
    if (step === 2) return "Identity Verification";
    if (step === 3) return "Education & Certification";
    return "Account & Declaration";
  }, [phase, step]);

 useEffect(() => {
  if (counter <= 0) return;

  const timer = setTimeout(() => {
    setCounter((prev) => prev - 1);
  }, 1000);

  return () => clearTimeout(timer);
}, [counter]);

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

  const validateAccount = () => {
    if (!/^\S+@\S+\.\S+$/.test(username.trim())) {
      return "Enter a valid email address.";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  const sendOtp = async () => {
    const validationError = validateAccount();

    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      setSendingOtp(true);
      setOtp("");
      setOtpError("");

      const response = await requestOtp(username.trim(), password);
      const apiMessage =
        (response as { message?: string })?.message ||
        "OTP sent. Please check your email.";

      showMessage(apiMessage);
      setCounter(60);
      setOtpDialog(true);
      setEmailLocked(true);
    } catch (err) {
      showError(getApiErrorMessage(err, "Failed to send OTP"));
    } finally {
      setSendingOtp(false);
    }
  };

  const confirmOtp = () => {
    if (!/^[0-9]{6}$/.test(otp)) {
      setOtpError("Please enter valid 6 digit OTP.");
      return;
    }

    setOtpDialog(false);
    setPhase("profile");
    showMessage("OTP verified successfully. Complete your profile.");
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
      if (!/^[0-9]{10}$/.test(mobileNumber.trim())) {
        return "Mobile number must be 10 digits.";
      }
      if (!/^[0-9]{6}$/.test(pincode)) return "Pincode must be 6 digits.";
      if (!city.trim() || !stateName.trim()) {
        return "City and state are required.";
      }
      if (!gender.trim()) return "Gender is required.";
      if (!dateOfBirth.trim()) return "Date of birth is required.";
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
        mobileNumber,
        email: username,
        password,
        otp,
        gender,
        dateOfBirth,
        pincode,
        city,
        state: stateName,
        languagesKnown,
        expertise,
        consultationModes,
        aboutYourself,
        fullAddress: address,
        documents: {
          aadharFront,
          aadharBack,
          educationDoc,
          certificateDoc,
          experienceLetter,
          profilePhoto,
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

      if (apiError.toLowerCase().includes("otp")) {
        setOtpDialog(true);
        setOtpError(apiError || "Invalid OTP. Please enter correct OTP.");
      } else {
        showError(apiError);
      }
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

    {/* <View style={styles.formPanel}>
      {phase === "account" ? renderAccount() : renderStep()}
    </View> */}

    {/* <OtpPopup /> */}
    {phase === "account" && otpDialog ? (
  <OtpScreen />
) : (
  <View style={styles.formPanel}>
    {phase === "account" ? renderAccount() : renderStep()}
  </View>
)}

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
  function renderAccount() {
    return (
      <View style={styles.section}>
        <SectionHeader
          stepLabel="Account setup"
          title="Create your login"
          description="Enter your email and password, then verify OTP."
        />

        <TextInput
          label="Email / Username"
          value={username}
          onChangeText={setUsername}
          editable={!emailLocked}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          theme={inputTheme}
          style={styles.input}
          outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secure}
          mode="outlined"
          theme={inputTheme}
          style={styles.input}
          outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
          right={
            <TextInput.Icon
              icon={secure ? "eye" : "eye-off"}
              onPress={() => setSecure((value) => !value)}
            />
          }
        />

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={secure}
          mode="outlined"
          theme={inputTheme}
          style={styles.input}
          outlineStyle={{
  borderRadius: 12,
}}

contentStyle={{
  paddingVertical: 2,
}}
        />

        <Button
          mode="contained"
          loading={sendingOtp}
          onPress={sendOtp}
          style={styles.primaryBtn}
          labelStyle={styles.primaryBtnText}
        >
          Continue to Astrologer Registration
        </Button>

        <HelperText type="info" visible>
          Already have an account? <Text style={{ color: "#b94717",fontWeight:"900" }} onPress={() => router.push("/(auth)/login")}>Login here</Text>
        </HelperText>
      </View>
    );
  }

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
              value={mobileNumber}
              onChangeText={(value) =>
                setMobileNumber(value.replace(/\D/g, "").slice(0, 10))
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
              value={username}
              editable={false}
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
            description="Upload Aadhar front and back document."
          />

          <View style={styles.twoColumns}>
            <UploadCard
              title="Aadhar Card Front"
              file={aadharFront}
              onPick={() => pickDocument(setAadharFront)}
            />

            <UploadCard
              title="Aadhar Card Back"
              file={aadharBack}
              onPick={() => pickDocument(setAadharBack)}
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
          title="Account & Declaration"
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

//   function OtpPopup() {
//     return (
//       <Portal>
//         <Dialog visible={otpDialog} dismissable={false}>
//           <Dialog.Content style={styles.otpBox}>
//             <Text style={styles.brand}>
//               Apsara<Text style={styles.green}>Astro</Text> Verification
//             </Text>

//             <Text style={styles.otpTitle}>OTP Verification</Text>

//             <Text style={styles.otpSub}>
//               Enter the OTP sent to{" "}
//               <Text style={styles.green}>{username}</Text>
//             </Text>

//             {/* <TextInput
//               value={otp}
//               onChangeText={(value) => {
//                 setOtp(value.replace(/\D/g, "").slice(0, 6));
//                 setOtpError("");
//               }}
//               keyboardType="number-pad"
//               maxLength={6}
//               mode="outlined"
//               placeholder="Enter 6 digit OTP"
//               theme={inputTheme}
//               style={styles.input}
//               outlineStyle={{
//   borderRadius: 12,
// }}

// contentStyle={{
//   paddingVertical: 2,
// }}
//             /> */}

//             <OtpBoxes
//   value={otp}
//   onChange={(value) => {
//     setOtp(value);
//     setOtpError("");
//   }}
// />

//             {!!otpError && <Text style={styles.otpError}>{otpError}</Text>}

//             <View style={styles.otpFooter}>
//               <View style={styles.resendBox}>
//                 <Text style={styles.resendTitle}>
//                   Didn't get OTP or try another username?
//                 </Text>

//                 {counter > 0 ? (
//                   <Text style={styles.counter}>
//                     Resend OTP available in 00:
//                     {String(counter).padStart(2, "0")}
//                   </Text>
//                 ) : (
//                   <Button
//                     mode="text"
//                     loading={sendingOtp}
//                     onPress={sendOtp}
//                     compact
//                   >
//                     Resend OTP
//                   </Button>
//                 )}
//               </View>

//               <Button
//                 mode="contained"
//                 onPress={confirmOtp}
//                 style={styles.verifyBtn}
//                 labelStyle={styles.verifyBtnText}
//               >
//                 Verify
//               </Button>
//             </View>
//           </Dialog.Content>
//         </Dialog>
//       </Portal>
//     );
//   }
function OtpScreen() {
  return (
    <View style={styles.otpScreen}>
      <Text style={styles.brand}>
        Apsara<Text style={styles.green}>Astro</Text> Verification
      </Text>

      <Text style={styles.otpTitle}>Enter OTP</Text>

      <Text style={styles.otpSub}>
        Enter the 6 digit OTP sent to{" "}
        <Text style={styles.green}>{username}</Text>
      </Text>

      <OtpBoxes
        value={otp}
        onChange={(value) => {
          setOtp(value);
          setOtpError("");
        }}
      />

      {!!otpError && <Text style={styles.otpError}>{otpError}</Text>}

      {counter > 0 ? (
        <Text style={styles.counter}>
          Resend OTP available in 00:{String(counter).padStart(2, "0")}
        </Text>
      ) : (
        <Button mode="text" loading={sendingOtp} onPress={sendOtp}>
          Resend OTP
        </Button>
      )}

      <Button
        mode="contained"
        onPress={confirmOtp}
        style={styles.verifyBtn}
        labelStyle={styles.verifyBtnText}
      >
        Verify
      </Button>
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

  otpBox: {
    borderRadius: 20,
    paddingVertical: 8,
  },

  brand: {
    fontWeight: "900",
    marginBottom: 20,
    color: "#111",
  },

  green: {
    color: "#b6f000",
    fontWeight: "900",
  },

  otpTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
  },

  otpSub: {
    color: "#555",
    marginBottom: 16,
  },

  otpError: {
    color: "red",
    marginTop: 6,
    fontSize: 13,
  },

  otpFooter: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  resendBox: {
    flex: 1,
  },

  resendTitle: {
    fontWeight: "800",
    color: "#596000",
    fontSize: 12,
  },

  counter: {
    color: "#555",
    fontSize: 12,
    marginTop: 4,
  },

  verifyBtn: {
    borderRadius: 14,
    backgroundColor: "#b6f000",
  },

  verifyBtnText: {
    color: "#111",
    fontWeight: "900",
  },

  errorSnack: {
    backgroundColor: colors.danger,
  },

//   otpContainer: {
//   flexDirection: "row",
//   justifyContent: "space-between",
//   marginVertical: 20,
// },

// otpDigit: {
//   width: 48,
//   height: 56,
//   borderWidth: 1,
//   borderColor: "#ead27a",
//   borderRadius: 12,
//   justifyContent: "center",
//   alignItems: "center",
//   backgroundColor: "#fff",
// },

// otpDigitText: {
//   fontSize: 22,
//   fontWeight: "700",
//   color: "#111",
// },

// hiddenOtpInput: {
//   position: "absolute",
//   opacity: 0,
// },
otpContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  gap: 8,
  marginVertical: 20,
},

otpDigitInput: {
  flex: 1,
  height: 56,
  backgroundColor: "#fff",
},

otpDigitOutline: {
  borderRadius: 10,
  borderColor: "#ead27a",
},

otpDigitContent: {
  textAlign: "center",
  fontSize: 22,
  fontWeight: "800",
  paddingHorizontal: 0,
},
otpScreen: {
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#ead27a",
  backgroundColor: "#fffaf0",
  padding: spacing.lg,
  gap: spacing.sm,
},
});