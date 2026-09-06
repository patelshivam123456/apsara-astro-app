import { type LanguageCode } from "@/context/LanguageContext";

const googleTranslateUrl = "https://translate.googleapis.com/translate_a/single";
const googleLanguageCodes: Partial<Record<LanguageCode, string>> = {
  gu: "gu",
  mwr: "mwr"
};

const astroContextTranslations: Partial<Record<LanguageCode, Record<string, string>>> = {
  hi: {
    "Mobile Numerology": "मोबाइल अंक ज्योतिष",
    "Mobile Number": "मोबाइल नंबर",
    "Mobile No.": "मोबाइल नंबर",
    DOB: "जन्म तिथि",
    "Download PDF": "PDF डाउनलोड करें",
    Downloading: "डाउनलोड हो रहा है",
    "PDF downloaded successfully.": "PDF सफलतापूर्वक डाउनलोड हो गया।",
    "PDF generated successfully.": "PDF सफलतापूर्वक बन गया।",
    "Unable to download PDF file.": "PDF फाइल डाउनलोड नहीं हो सकी।",
    "Relationship with MT": "MT के साथ संबंध",
    "MT : Mobile Number Single Digit Sum": "MT : मोबाइल नंबर का एकल अंक योग",
    Particular: "विवरण",
    Relation: "संबंध",
    Pair: "जोड़ी",
    Vibration: "कंपन",
    Traits: "गुण",
    Positive: "सकारात्मक",
    Negative: "नकारात्मक",
    Average: "औसत",
    Friend: "मित्र",
    Enemy: "शत्रु",
    Neutral: "तटस्थ",
    "Pair Analysis in Mobile Number": "मोबाइल नंबर में जोड़ी विश्लेषण",
    "Last Four Digits Analysis": "अंतिम चार अंकों का विश्लेषण",
    Placement: "स्थान",
    "Fourth Last (Identity)": "चौथा अंतिम (पहचान)",
    "Third Last (Expression)": "तीसरा अंतिम (अभिव्यक्ति)",
    "Second Last (Expectation)": "दूसरा अंतिम (अपेक्षा)",
    "Last (Manifestation)": "अंतिम (प्रकटीकरण)",
    "Mobile Summary": "मोबाइल सारांश",
    "Mobile Total": "मोबाइल कुल",
    "Mobile Compound Total": "मोबाइल संयुक्त कुल",
    "Normalized Name": "सामान्यीकृत नाम",
    Compound: "संयुक्त",
    "Inner Nature": "आंतरिक स्वभाव",
    "Life Path": "जीवन पथ",
    "Personal Energy": "व्यक्तिगत ऊर्जा",
    Years: "वर्ष",
    "Zodiac Sign": "राशि चिन्ह",
    "No records found": "कोई रिकॉर्ड नहीं मिला"
  },
  mr: {
    "Mobile Numerology": "मोबाइल अंकशास्त्र",
    "Mobile Number": "मोबाइल क्रमांक",
    "Mobile No.": "मोबाइल क्रमांक",
    DOB: "जन्मतारीख",
    "Download PDF": "PDF डाउनलोड करा",
    Downloading: "डाउनलोड होत आहे",
    "PDF downloaded successfully.": "PDF यशस्वीरित्या डाउनलोड झाला.",
    "PDF generated successfully.": "PDF यशस्वीरित्या तयार झाला.",
    "Unable to download PDF file.": "PDF फाइल डाउनलोड करता आली नाही.",
    "Relationship with MT": "MT सोबत संबंध",
    "MT : Mobile Number Single Digit Sum": "MT : मोबाइल क्रमांकाचा एक-अंकी योग",
    Particular: "तपशील",
    Relation: "संबंध",
    Pair: "जोडी",
    Vibration: "स्पंदन",
    Traits: "गुणधर्म",
    Positive: "सकारात्मक",
    Negative: "नकारात्मक",
    Average: "मध्यम",
    Friend: "मित्र",
    Enemy: "शत्रू",
    Neutral: "तटस्थ",
    "Pair Analysis in Mobile Number": "मोबाइल क्रमांकातील जोडी विश्लेषण",
    "Last Four Digits Analysis": "शेवटच्या चार अंकांचे विश्लेषण",
    Placement: "स्थान",
    "Fourth Last (Identity)": "चौथा शेवटचा (ओळख)",
    "Third Last (Expression)": "तिसरा शेवटचा (अभिव्यक्ती)",
    "Second Last (Expectation)": "दुसरा शेवटचा (अपेक्षा)",
    "Last (Manifestation)": "शेवटचा (प्रकटीकरण)",
    "Mobile Summary": "मोबाइल सारांश",
    "Mobile Total": "मोबाइल एकूण",
    "Mobile Compound Total": "मोबाइल संयुक्त एकूण",
    "Normalized Name": "सामान्यीकृत नाव",
    Compound: "संयुक्त",
    "Inner Nature": "आतील स्वभाव",
    "Life Path": "जीवन मार्ग",
    "Personal Energy": "वैयक्तिक ऊर्जा",
    Years: "वर्षे",
    "Zodiac Sign": "राशी चिन्ह",
    "No records found": "नोंदी आढळल्या नाहीत"
  },
  bn: {
    "Mobile Numerology": "মোবাইল সংখ্যাতত্ত্ব",
    "Mobile Number": "মোবাইল নম্বর",
    "Mobile No.": "মোবাইল নম্বর",
    DOB: "জন্ম তারিখ",
    "Download PDF": "PDF ডাউনলোড করুন",
    Downloading: "ডাউনলোড হচ্ছে",
    "PDF downloaded successfully.": "PDF সফলভাবে ডাউনলোড হয়েছে।",
    "PDF generated successfully.": "PDF সফলভাবে তৈরি হয়েছে।",
    "Unable to download PDF file.": "PDF ফাইল ডাউনলোড করা যায়নি।",
    "Relationship with MT": "MT-এর সাথে সম্পর্ক",
    "MT : Mobile Number Single Digit Sum": "MT : মোবাইল নম্বরের এক অঙ্কের যোগফল",
    Particular: "বিবরণ",
    Relation: "সম্পর্ক",
    Pair: "জোড়া",
    Vibration: "কম্পন",
    Traits: "বৈশিষ্ট্য",
    Positive: "ইতিবাচক",
    Negative: "নেতিবাচক",
    Average: "মধ্যম",
    Friend: "মিত্র",
    Enemy: "শত্রু",
    Neutral: "নিরপেক্ষ",
    "Pair Analysis in Mobile Number": "মোবাইল নম্বরে জোড়া বিশ্লেষণ",
    "Last Four Digits Analysis": "শেষ চার অঙ্কের বিশ্লেষণ",
    Placement: "স্থান",
    "Fourth Last (Identity)": "শেষ থেকে চতুর্থ (পরিচয়)",
    "Third Last (Expression)": "শেষ থেকে তৃতীয় (অভিব্যক্তি)",
    "Second Last (Expectation)": "শেষ থেকে দ্বিতীয় (প্রত্যাশা)",
    "Last (Manifestation)": "শেষ (প্রকাশ)",
    "Mobile Summary": "মোবাইল সারাংশ",
    "Mobile Total": "মোবাইল মোট",
    "Mobile Compound Total": "মোবাইল যৌগিক মোট",
    "Normalized Name": "স্বাভাবিকীকৃত নাম",
    Compound: "যৌগিক",
    "Inner Nature": "অন্তর্নিহিত স্বভাব",
    "Life Path": "জীবন পথ",
    "Personal Energy": "ব্যক্তিগত শক্তি",
    Years: "বছর",
    "Zodiac Sign": "রাশি চিহ্ন",
    "No records found": "কোনো রেকর্ড পাওয়া যায়নি"
  },
  ta: {
    "Mobile Numerology": "மொபைல் எண் ஜோதிடம்",
    "Mobile Number": "மொபைல் எண்",
    "Mobile No.": "மொபைல் எண்",
    DOB: "பிறந்த தேதி",
    "Download PDF": "PDF பதிவிறக்கம்",
    Downloading: "பதிவிறக்குகிறது",
    "PDF downloaded successfully.": "PDF வெற்றிகரமாக பதிவிறக்கப்பட்டது.",
    "PDF generated successfully.": "PDF வெற்றிகரமாக உருவாக்கப்பட்டது.",
    "Unable to download PDF file.": "PDF கோப்பை பதிவிறக்க முடியவில்லை.",
    "Relationship with MT": "MT உடனான உறவு",
    "MT : Mobile Number Single Digit Sum": "MT : மொபைல் எண்ணின் ஒற்றை இலக்க கூட்டுத்தொகை",
    Particular: "விவரம்",
    Relation: "உறவு",
    Pair: "ஜோடி",
    Vibration: "அதிர்வு",
    Traits: "குணங்கள்",
    Positive: "நேர்மறை",
    Negative: "எதிர்மறை",
    Average: "சராசரி",
    Friend: "நண்பர்",
    Enemy: "எதிரி",
    Neutral: "நடுநிலை",
    "Pair Analysis in Mobile Number": "மொபைல் எண்ணில் ஜோடி பகுப்பாய்வு",
    "Last Four Digits Analysis": "கடைசி நான்கு இலக்க பகுப்பாய்வு",
    Placement: "இடம்",
    "Fourth Last (Identity)": "கடைசியில் நான்காவது (அடையாளம்)",
    "Third Last (Expression)": "கடைசியில் மூன்றாவது (வெளிப்பாடு)",
    "Second Last (Expectation)": "கடைசியில் இரண்டாவது (எதிர்பார்ப்பு)",
    "Last (Manifestation)": "கடைசி (வெளிப்படுத்தல்)",
    "Mobile Summary": "மொபைல் சுருக்கம்",
    "Mobile Total": "மொபைல் மொத்தம்",
    "Mobile Compound Total": "மொபைல் கூட்டு மொத்தம்",
    "Normalized Name": "சீரமைக்கப்பட்ட பெயர்",
    Compound: "கூட்டு",
    "Inner Nature": "உள் இயல்பு",
    "Life Path": "வாழ்க்கைப் பாதை",
    "Personal Energy": "தனிப்பட்ட ஆற்றல்",
    Years: "ஆண்டுகள்",
    "Zodiac Sign": "ராசி குறி",
    "No records found": "பதிவுகள் இல்லை"
  },
  te: {
    "Mobile Numerology": "మొబైల్ సంఖ్యాశాస్త్రం",
    "Mobile Number": "మొబైల్ నంబర్",
    "Mobile No.": "మొబైల్ నంబర్",
    DOB: "పుట్టిన తేదీ",
    "Download PDF": "PDF డౌన్‌లోడ్ చేయండి",
    Downloading: "డౌన్‌లోడ్ అవుతోంది",
    "PDF downloaded successfully.": "PDF విజయవంతంగా డౌన్‌లోడ్ అయింది.",
    "PDF generated successfully.": "PDF విజయవంతంగా రూపొందింది.",
    "Unable to download PDF file.": "PDF ఫైల్‌ను డౌన్‌లోడ్ చేయలేకపోయాం.",
    "Relationship with MT": "MT తో సంబంధం",
    "MT : Mobile Number Single Digit Sum": "MT : మొబైల్ నంబర్ యొక్క ఒక అంకె మొత్తం",
    Particular: "వివరం",
    Relation: "సంబంధం",
    Pair: "జత",
    Vibration: "కంపనం",
    Traits: "లక్షణాలు",
    Positive: "అనుకూలం",
    Negative: "ప్రతికూలం",
    Average: "సగటు",
    Friend: "మిత్రుడు",
    Enemy: "శత్రువు",
    Neutral: "తటస్థం",
    "Pair Analysis in Mobile Number": "మొబైల్ నంబర్‌లో జత విశ్లేషణ",
    "Last Four Digits Analysis": "చివరి నాలుగు అంకెల విశ్లేషణ",
    Placement: "స్థానం",
    "Fourth Last (Identity)": "చివరి నుండి నాలుగవది (గుర్తింపు)",
    "Third Last (Expression)": "చివరి నుండి మూడవది (వ్యక్తీకరణ)",
    "Second Last (Expectation)": "చివరి నుండి రెండవది (అంచనా)",
    "Last (Manifestation)": "చివరి (ప్రకటన)",
    "Mobile Summary": "మొబైల్ సారాంశం",
    "Mobile Total": "మొబైల్ మొత్తం",
    "Mobile Compound Total": "మొబైల్ సంయుక్త మొత్తం",
    "Normalized Name": "సాధారణీకరించిన పేరు",
    Compound: "సంయుక్తం",
    "Inner Nature": "అంతర్గత స్వభావం",
    "Life Path": "జీవన మార్గం",
    "Personal Energy": "వ్యక్తిగత శక్తి",
    Years: "సంవత్సరాలు",
    "Zodiac Sign": "రాశి గుర్తు",
    "No records found": "రికార్డులు లేవు"
  },
  gu: {
    "Mobile Numerology": "મોબાઇલ અંકશાસ્ત્ર",
    "Mobile Number": "મોબાઇલ નંબર",
    "Mobile No.": "મોબાઇલ નંબર",
    DOB: "જન્મ તારીખ",
    "Download PDF": "PDF ડાઉનલોડ કરો",
    Downloading: "ડાઉનલોડ થઈ રહ્યું છે",
    "PDF downloaded successfully.": "PDF સફળતાપૂર્વક ડાઉનલોડ થયું.",
    "PDF generated successfully.": "PDF સફળતાપૂર્વક બન્યું.",
    "Unable to download PDF file.": "PDF ફાઇલ ડાઉનલોડ થઈ શકી નહીં.",
    "Relationship with MT": "MT સાથે સંબંધ",
    "MT : Mobile Number Single Digit Sum": "MT : મોબાઇલ નંબરનો એક અંકનો સરવાળો",
    Particular: "વિગત",
    Relation: "સંબંધ",
    Pair: "જોડી",
    Vibration: "કંપન",
    Traits: "ગુણધર્મો",
    Positive: "સકારાત્મક",
    Negative: "નકારાત્મક",
    Average: "સરેરાશ",
    Friend: "મિત્ર",
    Enemy: "શત્રુ",
    Neutral: "તટસ્થ",
    "Pair Analysis in Mobile Number": "મોબાઇલ નંબરમાં જોડી વિશ્લેષણ",
    "Last Four Digits Analysis": "છેલ્લા ચાર અંકોનું વિશ્લેષણ",
    Placement: "સ્થાન",
    "Fourth Last (Identity)": "છેલ્લેથી ચોથું (ઓળખ)",
    "Third Last (Expression)": "છેલ્લેથી ત્રીજું (અભિવ્યક્તિ)",
    "Second Last (Expectation)": "છેલ્લેથી બીજું (અપેક્ષા)",
    "Last (Manifestation)": "છેલ્લું (પ્રકટીકરણ)",
    "Mobile Summary": "મોબાઇલ સારાંશ",
    "Mobile Total": "મોબાઇલ કુલ",
    "Mobile Compound Total": "મોબાઇલ સંયુક્ત કુલ",
    "Normalized Name": "સામાન્યીકૃત નામ",
    Compound: "સંયુક્ત",
    "Inner Nature": "આંતરિક સ્વભાવ",
    "Life Path": "જીવન માર્ગ",
    "Personal Energy": "વ્યક્તિગત ઊર્જા",
    Years: "વર્ષ",
    "Zodiac Sign": "રાશિ ચિહ્ન",
    "No records found": "કોઈ રેકોર્ડ મળ્યો નથી"
  },
  mwr: {
    "Mobile Numerology": "मोबाइल अंक ज्योतिष",
    "Mobile Number": "मोबाइल नंबर",
    "Mobile No.": "मोबाइल नंबर",
    DOB: "जनम तारीख",
    "Download PDF": "PDF डाउनलोड करो",
    Downloading: "डाउनलोड हो रियो है",
    "PDF downloaded successfully.": "PDF सफलतापूर्वक डाउनलोड हो गयो.",
    "PDF generated successfully.": "PDF सफलतापूर्वक बन गयो.",
    "Unable to download PDF file.": "PDF फाइल डाउनलोड कोनी हो सकी.",
    "Relationship with MT": "MT सूं संबंध",
    "MT : Mobile Number Single Digit Sum": "MT : मोबाइल नंबर रो एकल अंक जोड़",
    Particular: "विवरण",
    Relation: "संबंध",
    Pair: "जोड़ी",
    Vibration: "कंपन",
    Traits: "गुण",
    Positive: "सकारात्मक",
    Negative: "नकारात्मक",
    Average: "औसत",
    Friend: "मित्र",
    Enemy: "बैरी",
    Neutral: "तटस्थ",
    "Pair Analysis in Mobile Number": "मोबाइल नंबर में जोड़ी विश्लेषण",
    "Last Four Digits Analysis": "आखरी चार अंकों रो विश्लेषण",
    Placement: "स्थान",
    "Fourth Last (Identity)": "चौथो आखरी (पहचान)",
    "Third Last (Expression)": "तीजो आखरी (अभिव्यक्ति)",
    "Second Last (Expectation)": "दूजो आखरी (अपेक्षा)",
    "Last (Manifestation)": "आखरी (प्रकटीकरण)",
    "Mobile Summary": "मोबाइल सार",
    "Mobile Total": "मोबाइल कुल",
    "Mobile Compound Total": "मोबाइल संयुक्त कुल",
    "Normalized Name": "सामान्यीकृत नाम",
    Compound: "संयुक्त",
    "Inner Nature": "भीतरलो स्वभाव",
    "Life Path": "जीवन पथ",
    "Personal Energy": "निजी ऊर्जा",
    Years: "बरस",
    "Zodiac Sign": "राशी चिन्ह",
    "No records found": "कोई रिकॉर्ड कोनी मिल्यो"
  }
};

const astroContextReplacements: Partial<Record<LanguageCode, [RegExp, string][]>> = {
  hi: [[/एस्ट्रो\s*प्रतियोगिता|ज्योतिष\s*प्रतियोगिता/g, "ज्योतिष संदर्भ"]],
  mr: [[/अॅस्ट्रो\s*स्पर्धा|ज्योतिष\s*स्पर्धा/g, "ज्योतिष संदर्भ"]],
  bn: [[/অ্যাস্ট্রো\s*প্রতিযোগিতা|জ্যোতিষ\s*প্রতিযোগিতা/g, "জ্যোতিষ প্রেক্ষাপট"]],
  ta: [[/ஆஸ்ட்ரோ\s*போட்டி|ஜோதிட\s*போட்டி/g, "ஜோதிட சூழல்"]],
  te: [[/ఆస్ట్రో\s*పోటీ|జ్యోతిష్య\s*పోటీ/g, "జ్యోతిష్య సందర్భం"]],
  gu: [[/એસ્ટ્રો\s*સ્પર્ધા|જ્યોતિષ\s*સ્પર્ધા/g, "જ્યોતિષ સંદર્ભ"]],
  mwr: [[/एस्ट्रो\s*प्रतियोगिता|ज्योतिष\s*प्रतियोगिता/g, "ज्योतिष संदर्भ"]]
};

export function getAstroContextTranslation(text: string, targetLanguage: LanguageCode) {
  if (!text || targetLanguage === "en") return text;
  return astroContextTranslations[targetLanguage]?.[text] || "";
}

export async function translateText(text: string, targetLanguage: LanguageCode) {
  const cleanText = text.trim();
  if (!cleanText || targetLanguage === "en") return text;
  const curatedTranslation = getAstroContextTranslation(cleanText, targetLanguage);
  if (curatedTranslation) return curatedTranslation;

  const query = new URLSearchParams({
    client: "gtx",
    sl: "en",
    tl: googleLanguageCodes[targetLanguage] || targetLanguage,
    dt: "t",
    q: cleanText
  });

  const response = await fetch(`${googleTranslateUrl}?${query.toString()}`);
  if (!response.ok) {
    throw new Error("Unable to translate text");
  }

  const data = (await response.json()) as unknown;
  const translated = parseGoogleTranslation(data);
  return applyAstroContextReplacements(translated || text, targetLanguage);
}

export async function translateUniqueTexts(texts: string[], targetLanguage: LanguageCode) {
  if (targetLanguage === "en") {
    return new Map(texts.map((text) => [text, text]));
  }

  const uniqueTexts = [...new Set(texts.filter((text) => text.trim()))];
  const translatedPairs = await Promise.all(
    uniqueTexts.map(async (text) => {
      try {
        return [text, await translateText(text, targetLanguage)] as const;
      } catch {
        return [text, text] as const;
      }
    })
  );

  return new Map(translatedPairs);
}

function parseGoogleTranslation(data: unknown) {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return "";

  return data[0]
    .map((part) => (Array.isArray(part) && typeof part[0] === "string" ? part[0] : ""))
    .join("")
    .trim();
}

function applyAstroContextReplacements(text: string, targetLanguage: LanguageCode) {
  return (astroContextReplacements[targetLanguage] || []).reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text
  );
}
