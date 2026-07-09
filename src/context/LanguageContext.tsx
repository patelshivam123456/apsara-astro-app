import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { translateText } from "@/services/translation.service";

export type LanguageCode = "en" | "hi" | "mr" | "bn" | "ta" | "te";

export const languages: { code: LanguageCode; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" }
];

const storageKey = "apsara-app-language";

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {},
  hi: {
    Language: "भाषा",
    "Choose Language": "भाषा चुनें",
    Home: "होम",
    Chat: "चैट",
    Call: "कॉल",
    Remedy: "उपाय",
    Profile: "प्रोफाइल",
    Logout: "लॉगआउट",
    Numerology: "अंक ज्योतिष",
    "My Horoscope": "मेरा राशिफल",
    "Tarot Reading": "टैरो रीडिंग",
    "Vastu Consultation": "वास्तु परामर्श",
    "Consultation with Palmist": "हस्तरेखा परामर्श",
    "Consultation with Graphologist": "ग्राफोलॉजिस्ट परामर्श",
    "Gift Card": "गिफ्ट कार्ड",
    "Gift Cards": "गिफ्ट कार्ड",
    "Wallet transaction History": "वॉलेट लेन-देन इतिहास",
    "Wallet History": "वॉलेट इतिहास",
    "Order History": "ऑर्डर इतिहास",
    Store: "स्टोर",
    "Customer Care": "कस्टमर केयर",
    Setting: "सेटिंग",
    Settings: "सेटिंग्स",
    "Welcome Back": "वापसी पर स्वागत है",
    Welcome: "स्वागत है",
    "Wallet Balance": "वॉलेट बैलेंस",
    "Daily\nPredictions": "दैनिक\nभविष्यवाणी",
    "Daily Predictions": "दैनिक भविष्यवाणी",
    "Horoscope Compatibility": "राशिफल अनुकूलता",
    Horoscope: "राशिफल",
    Compatibility: "अनुकूलता",
    "Today's\nMuhurta": "आज का\nमुहूर्त",
    "Today's Muhurta": "आज का मुहूर्त",
    "Today's\nPanchang": "आज का\nपंचांग",
    Panchang: "पंचांग",
    Numeroscope: "न्यूमेरोस्कोप",
    "E-Pooja": "ई-पूजा",
    "CHAT\nNOW": "अभी\nचैट करें",
    "Claim Your First Free Chat": "अपनी पहली फ्री चैट लें",
    "Claim Your\nFirst\nFree Chat": "अपनी\nपहली\nफ्री चैट लें",
    "Chat Now": "अभी चैट करें",
    "Top Astrologers": "शीर्ष ज्योतिषी",
    "Top Astrologers & Numerologist": "शीर्ष ज्योतिषी और अंकशास्त्री",
    "View all": "सभी देखें",
    "Gem stone & Pyrites": "रत्न और पाइराइट्स",
    Gemstones: "रत्न",
    Pyrites: "पाइराइट्स",
    "Spiritual Products": "आध्यात्मिक उत्पाद",
    "Apsara Astro Blogs": "अप्सरा एस्ट्रो ब्लॉग",
    "Apsra Astro Blogs": "अप्सरा एस्ट्रो ब्लॉग",
    "Verified Professionals": "सत्यापित विशेषज्ञ",
    "Verified\nProfessionals": "सत्यापित\nविशेषज्ञ",
    "Confidential Consultation": "गोपनीय परामर्श",
    "Confidential\nConsultation": "गोपनीय\nपरामर्श",
    "Secure Payments": "सुरक्षित भुगतान",
    "Seamless &\nSecure\nPayment": "आसान और\nसुरक्षित\nभुगतान",
    Back: "वापस",
    "Full Name": "पूरा नाम",
    "Date of Birth (DD-MM-YYYY)": "जन्म तिथि (DD-MM-YYYY)",
    Male: "पुरुष",
    Female: "महिला",
    Other: "अन्य",
    Submit: "सबमिट",
    Clear: "क्लियर",
    "Lo Shu Grid": "लो शू ग्रिड",
    "Personality Number": "व्यक्तित्व संख्या",
    "Destiny Number": "भाग्य संख्या",
    "Kua Number": "कुआ संख्या",
    "Name Number": "नाम संख्या",
    "Running Age": "वर्तमान आयु",
    Zodiac: "राशि",
    "Check Personality and Destiny Details": "व्यक्तित्व और भाग्य विवरण देखें",
    Personality: "व्यक्तित्व",
    Destiny: "भाग्य",
    "Current Personal Year": "वर्तमान व्यक्तिगत वर्ष",
    "Current Personal Month": "वर्तमान व्यक्तिगत माह",
    "Current Personal Day": "वर्तमान व्यक्तिगत दिन",
    "Matrix for Personal Year & Month": "व्यक्तिगत वर्ष और माह मैट्रिक्स",
    "From Year": "वर्ष से",
    "To Year": "वर्ष तक",
    Apply: "लागू करें",
    Loading: "लोड हो रहा है",
    "Translating...": "अनुवाद हो रहा है...",
    "No data available.": "डेटा उपलब्ध नहीं है।",
    "Combination Key": "संयोजन कुंजी",
    Retry: "पुनः प्रयास करें",
    "Core Characteristics": "मुख्य विशेषताएं",
    "Common Pitfalls": "सामान्य कमियां",
    "Primary Health Vulnerabilities": "मुख्य स्वास्थ्य कमजोरियां",
    "Top Career Roles": "शीर्ष करियर भूमिकाएं",
    "Top Career Sectors": "शीर्ष करियर क्षेत्र",
    Lord: "स्वामी",
    Colour: "रंग",
    Number: "संख्या",
    Year: "वर्ष",
    "Personal\nYear": "व्यक्तिगत\nवर्ष",
    "Personal Month": "व्यक्तिगत माह",
    Jan: "जन",
    Feb: "फ़र",
    Mar: "मार्च",
    Apr: "अप्रै",
    May: "मई",
    Jun: "जून",
    Jul: "जुल",
    Aug: "अग",
    Sep: "सित",
    Oct: "अक्टू",
    Nov: "नवं",
    Dec: "दिसं",
    Friend: "मित्र",
    Enemy: "शत्रु",
    Neutral: "तटस्थ",
    Career: "करियर",
    Health: "स्वास्थ्य",
    Finance: "वित्त",
    Relationship: "संबंध",
    "Personal Year reading": "व्यक्तिगत वर्ष रीडिंग",
    "Your running personal year is": "आपका वर्तमान व्यक्तिगत वर्ष है",
    of: "का"
  },
  mr: {
    Language: "भाषा",
    "Choose Language": "भाषा निवडा",
    Home: "मुख्यपृष्ठ",
    Chat: "चॅट",
    Call: "कॉल",
    Remedy: "उपाय",
    Profile: "प्रोफाइल",
    Logout: "लॉगआउट",
    Numerology: "अंकशास्त्र",
    "My Horoscope": "माझे राशीभविष्य",
    "Tarot Reading": "टॅरो रीडिंग",
    "Vastu Consultation": "वास्तु सल्ला",
    Settings: "सेटिंग्स",
    "Welcome Back": "पुन्हा स्वागत",
    Welcome: "स्वागत",
    "Wallet Balance": "वॉलेट शिल्लक",
    Back: "मागे",
    "Full Name": "पूर्ण नाव",
    Submit: "सबमिट",
    Clear: "क्लिअर",
    Personality: "व्यक्तिमत्व",
    Destiny: "नियती",
    Number: "संख्या",
    Year: "वर्ष",
    "Personal\nYear": "वैयक्तिक\nवर्ष",
    "Personal Month": "वैयक्तिक महिना",
    Jan: "जाने",
    Feb: "फेब्रु",
    Mar: "मार्च",
    Apr: "एप्रि",
    May: "मे",
    Jun: "जून",
    Jul: "जुलै",
    Aug: "ऑग",
    Sep: "सप्टें",
    Oct: "ऑक्टो",
    Nov: "नोव्हें",
    Dec: "डिसें",
    Career: "करिअर",
    Health: "आरोग्य",
    Finance: "आर्थिक",
    Relationship: "नातेसंबंध",
    Loading: "लोड होत आहे",
    "Translating...": "भाषांतर होत आहे...",
    "No data available.": "डेटा उपलब्ध नाही.",
    Retry: "पुन्हा प्रयत्न करा"
  },
  bn: {
    Language: "ভাষা",
    "Choose Language": "ভাষা নির্বাচন করুন",
    Home: "হোম",
    Chat: "চ্যাট",
    Call: "কল",
    Remedy: "প্রতিকার",
    Profile: "প্রোফাইল",
    Logout: "লগআউট",
    Numerology: "সংখ্যাতত্ত্ব",
    Settings: "সেটিংস",
    "Welcome Back": "আবার স্বাগতম",
    Welcome: "স্বাগতম",
    Back: "ফিরে যান",
    "Full Name": "পূর্ণ নাম",
    Submit: "জমা দিন",
    Clear: "পরিষ্কার",
    Personality: "ব্যক্তিত্ব",
    Destiny: "ভাগ্য",
    Number: "সংখ্যা",
    Year: "বছর",
    "Personal\nYear": "ব্যক্তিগত\nবছর",
    "Personal Month": "ব্যক্তিগত মাস",
    Jan: "জানু",
    Feb: "ফেব",
    Mar: "মার্চ",
    Apr: "এপ্রি",
    May: "মে",
    Jun: "জুন",
    Jul: "জুলাই",
    Aug: "আগ",
    Sep: "সেপ্ট",
    Oct: "অক্টো",
    Nov: "নভে",
    Dec: "ডিসে",
    Career: "ক্যারিয়ার",
    Health: "স্বাস্থ্য",
    Finance: "অর্থ",
    Relationship: "সম্পর্ক",
    Loading: "লোড হচ্ছে",
    "Translating...": "অনুবাদ হচ্ছে...",
    "No data available.": "কোনো তথ্য উপলব্ধ নেই।",
    Retry: "আবার চেষ্টা করুন"
  },
  ta: {
    Language: "மொழி",
    "Choose Language": "மொழியை தேர்வு செய்யவும்",
    Home: "முகப்பு",
    Chat: "அரட்டை",
    Call: "அழைப்பு",
    Remedy: "பரிகாரம்",
    Profile: "சுயவிவரம்",
    Logout: "வெளியேறு",
    Numerology: "எண் ஜோதிடம்",
    Settings: "அமைப்புகள்",
    "Welcome Back": "மீண்டும் வரவேற்கிறோம்",
    Welcome: "வரவேற்பு",
    Back: "பின்",
    "Full Name": "முழு பெயர்",
    Submit: "சமர்ப்பி",
    Clear: "அழி",
    Personality: "தன்மை",
    Destiny: "விதி",
    Number: "எண்",
    Year: "ஆண்டு",
    "Personal\nYear": "தனிப்பட்ட\nஆண்டு",
    "Personal Month": "தனிப்பட்ட மாதம்",
    Jan: "ஜன",
    Feb: "பிப்",
    Mar: "மார்",
    Apr: "ஏப்",
    May: "மே",
    Jun: "ஜூன்",
    Jul: "ஜூலை",
    Aug: "ஆக",
    Sep: "செப்",
    Oct: "அக்",
    Nov: "நவ",
    Dec: "டிச",
    Career: "தொழில்",
    Health: "ஆரோக்கியம்",
    Finance: "நிதி",
    Relationship: "உறவு",
    Loading: "ஏற்றுகிறது",
    "Translating...": "மொழிபெயர்க்கிறது...",
    "No data available.": "தரவு கிடைக்கவில்லை.",
    Retry: "மீண்டும் முயற்சி"
  },
  te: {
    Language: "భాష",
    "Choose Language": "భాషను ఎంచుకోండి",
    Home: "హోమ్",
    Chat: "చాట్",
    Call: "కాల్",
    Remedy: "పరిహారం",
    Profile: "ప్రొఫైల్",
    Logout: "లాగౌట్",
    Numerology: "సంఖ్యాశాస్త్రం",
    Settings: "సెట్టింగులు",
    "Welcome Back": "మళ్లీ స్వాగతం",
    Welcome: "స్వాగతం",
    Back: "వెనుకకు",
    "Full Name": "పూర్తి పేరు",
    Submit: "సబ్మిట్",
    Clear: "క్లియర్",
    Personality: "వ్యక్తిత్వం",
    Destiny: "విధి",
    Number: "సంఖ్య",
    Year: "సంవత్సరం",
    "Personal\nYear": "వ్యక్తిగత\nసంవత్సరం",
    "Personal Month": "వ్యక్తిగత నెల",
    Jan: "జన",
    Feb: "ఫిబ్ర",
    Mar: "మార్చి",
    Apr: "ఏప్రి",
    May: "మే",
    Jun: "జూన్",
    Jul: "జులై",
    Aug: "ఆగ",
    Sep: "సెప్టె",
    Oct: "అక్టో",
    Nov: "నవం",
    Dec: "డిసె",
    Career: "కెరీర్",
    Health: "ఆరోగ్యం",
    Finance: "ఆర్థికం",
    Relationship: "సంబంధం",
    Loading: "లోడ్ అవుతోంది",
    "Translating...": "అనువదిస్తోంది...",
    "No data available.": "డేటా అందుబాటులో లేదు.",
    Retry: "మళ్లీ ప్రయత్నించండి"
  }
};

const reportPrefixTranslations: Record<LanguageCode, Record<string, string>> = {
  en: {},
  hi: {
    "Called \"Money Magnets\"": "कहते हैं \"मनी मैग्नेट्स\"",
    "Versatile Mindset": "बहुमुखी मानसिकता",
    "Magnetic Charisma": "आकर्षक व्यक्तित्व",
    "Sharp Business Instincts": "तेज व्यावसायिक समझ",
    "Rapid Recovery": "तेजी से वापसी",
    "Extreme Restlessness": "अत्यधिक बेचैनी",
    "Impulsive Choices": "आवेगपूर्ण निर्णय",
    "Scattered Focus": "बिखरा हुआ ध्यान",
    "Commitment Issues": "प्रतिबद्धता की समस्या",
    "Burnout & Exhaustion": "बर्नआउट और थकान",
    "Anxiety Loops": "चिंता के चक्र",
    Insomnia: "अनिद्रा",
    "Lung Sensitivity": "फेफड़ों की संवेदनशीलता",
    "Speech Impediments": "बोलने में बाधा",
    "Nervous Stomach": "नर्वस पेट",
    "Weak Digestion": "कमजोर पाचन",
    "Stress Rashes": "तनाव से चकत्ते",
    "Hand and Shoulder Pain": "हाथ और कंधे का दर्द",
    "Business Development Managers": "बिजनेस डेवलपमेंट मैनेजर",
    "Public Relations Specialists": "जनसंपर्क विशेषज्ञ",
    "Digital Marketing Strategists": "डिजिटल मार्केटिंग रणनीतिकार",
    "Investigative Journalists": "खोजी पत्रकार",
    "Event Managers": "इवेंट मैनेजर",
    "Content Creators & Anchors": "कंटेंट क्रिएटर और एंकर",
    "Stock Traders & Brokers": "स्टॉक ट्रेडर और ब्रोकर",
    "Import-Export Entrepreneurs": "आयात-निर्यात उद्यमी",
    "Ventures Capitalists": "वेंचर कैपिटलिस्ट",
    "Travel Bloggers & Consultants": "ट्रैवल ब्लॉगर और सलाहकार",
    "Aviation Professionals": "एविएशन प्रोफेशनल्स",
    "Financial Markets & Fast Trading": "वित्तीय बाजार और तेज ट्रेडिंग",
    "Import-Export Business": "आयात-निर्यात व्यवसाय",
    "Digital Marketing & Media Communications": "डिजिटल मार्केटिंग और मीडिया संचार",
    "E-commerce & Dropshipping": "ई-कॉमर्स और ड्रॉपशिपिंग",
    "Entertainment & Broadcasting": "मनोरंजन और प्रसारण",
    "Advertising, Sales & Freelance Consulting": "विज्ञापन, बिक्री और फ्रीलांस कंसल्टिंग",
    "Strategic Business Consulting": "रणनीतिक बिजनेस कंसल्टिंग",
    "Universal Humanitarianism": "सार्वभौमिक मानवतावाद",
    "Charismatic Idealism": "करिश्माई आदर्शवाद",
    "Artistic Creativity": "कलात्मक रचनात्मकता",
    "Spiritual Detachment": "आध्यात्मिक वैराग्य",
    "Fearless Advocacy": "निर्भीक समर्थन",
    "Crisis Resilience": "संकट में धैर्य",
    "Emotional Bravery": "भावनात्मक साहस",
    "Championing the Vulnerable": "कमजोरों की रक्षा",
    "The Martyr Complex": "त्यागी मानसिकता",
    "Fiery Mars Outbursts": "मंगल जैसे तीखे विस्फोट",
    "Cynical Disappointment": "कटु निराशा",
    "Inability to Let Go": "छोड़ न पाने की प्रवृत्ति",
    "Preachy Self-Righteousness": "उपदेशात्मक आत्म-धार्मिकता",
    "Blood and Circulatory Issues": "रक्त और परिसंचरण समस्याएं",
    "Inflammation and Fevers": "सूजन और बुखार",
    "Frequent Injuries & Accidental Scars": "बार-बार चोट और निशान",
    "Liver & Bile Disorders": "लिवर और पित्त विकार",
    "Throat & Vocal Fatigue": "गला और आवाज की थकान",
    "Fiery Mars Burnout": "मंगल ऊर्जा से बर्नआउट",
    "Insomnia via Hyper-Arousal": "अत्यधिक उत्तेजना से अनिद्रा",
    "NGO Founder / International Activist": "एनजीओ संस्थापक / अंतरराष्ट्रीय कार्यकर्ता",
    "Human Rights Lawyer / Public Defender": "मानवाधिकार वकील / जन रक्षक",
    "United Nations (UN) Officer / Diplomat": "संयुक्त राष्ट्र अधिकारी / राजनयिक",
    "Environmental Scientist / Conservation Director": "पर्यावरण वैज्ञानिक / संरक्षण निदेशक",
    "Trauma Surgeon / Emergency Room Doctor": "ट्रॉमा सर्जन / इमरजेंसी डॉक्टर",
    "Psychiatrist / Addiction Counselor": "मनोचिकित्सक / नशा परामर्शदाता",
    "Disaster Relief Coordinator": "आपदा राहत समन्वयक",
    "Film Director / Screenwriter": "फिल्म निर्देशक / पटकथा लेखक",
    "Fine Artist / Sculptor / Photographer": "फाइन आर्टिस्ट / मूर्तिकार / फोटोग्राफर",
    "Investigative Journalist / Documentary Filmmaker": "खोजी पत्रकार / डॉक्यूमेंट्री फिल्ममेकर",
    "Military Commander / Defense Strategist": "सैन्य कमांडर / रक्षा रणनीतिकार",
    "Fire Chief / Search and Rescue Specialist": "फायर चीफ / खोज और बचाव विशेषज्ञ",
    "Public Statesperson / Reformer": "जन नेता / सुधारक",
    "Non-Profits, International Relations & Social Reform": "गैर-लाभ, अंतरराष्ट्रीय संबंध और सामाजिक सुधार",
    "Healthcare, Emergency Medicine & Psychiatry": "स्वास्थ्य सेवा, आपात चिकित्सा और मनोचिकित्सा",
    "Mass Media, Fine Arts & Cultural Influence": "मास मीडिया, ललित कला और सांस्कृतिक प्रभाव",
    "Defense, Armed Forces & Law Enforcement": "रक्षा, सशस्त्र बल और कानून व्यवस्था"
  },
  mr: {},
  bn: {},
  ta: {},
  te: {}
};

function translateReportValue(language: LanguageCode, text: string) {
  if (language === "en") return text;
  const colonIndex = text.indexOf(":");
  if (colonIndex <= 0) return text;
  const prefix = text.slice(0, colonIndex).trim();
  const rest = text.slice(colonIndex + 1);
  const translatedPrefix =
    reportPrefixTranslations[language][prefix] ||
    reportPrefixTranslations.hi[prefix];

  if (!translatedPrefix) return text;
  return `${translatedPrefix}:${rest}`;
}

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (text: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [translationVersion, setTranslationVersion] = useState(0);
  const autoTranslationsRef = useRef<Partial<Record<LanguageCode, Record<string, string>>>>({});
  const pendingTranslationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((saved) => {
      if (languages.some((item) => item.code === saved)) {
        setLanguageState(saved as LanguageCode);
      }
    });
  }, []);

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    AsyncStorage.setItem(storageKey, nextLanguage);
  };

  const t = useCallback(
    (text: string) => {
      if (!text || language === "en") return text;

      const configuredTranslation = translations[language][text] || translateReportValue(language, text);
      if (configuredTranslation !== text) return configuredTranslation;

      const cachedTranslation = autoTranslationsRef.current[language]?.[text];
      if (cachedTranslation) return cachedTranslation;

      const pendingKey = `${language}:${text}`;
      if (!pendingTranslationsRef.current.has(pendingKey)) {
        pendingTranslationsRef.current.add(pendingKey);
        translateText(text, language)
          .then((translatedText) => {
            if (!translatedText || translatedText === text) return;
            autoTranslationsRef.current = {
              ...autoTranslationsRef.current,
              [language]: {
                ...(autoTranslationsRef.current[language] || {}),
                [text]: translatedText
              }
            };
            setTranslationVersion((version) => version + 1);
          })
          .finally(() => {
            pendingTranslationsRef.current.delete(pendingKey);
          });
      }

      return text;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t
    }),
    [language, t, translationVersion]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used inside LanguageProvider");
  }
  return context;
}
