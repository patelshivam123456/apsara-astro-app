import { LanguageCode } from "@/context/LanguageContext";
import {
  getChaldeanNameLetterAnalysisChart,
  getChaldeanNamePairEvents,
  getLoShuGrid,
  getLoShuRepetitionEffects,
  getNameFrequencyNameChart,
  getNumberRelationships,
  getPersonalYear,
  getPersonalYearMatrix,
  getPythagoreanGrid,
  getPythagoreanNameTable,
  getPythagoreanRunningAgeAlphabet,
  getSectorWiseEffects,
  getVedicGrid,
  NumerologyPayload
} from "@/services/numerology.service";

import { NumerologyExportSection } from "./NumerologyExport";
import { buildLoShuCountsPayload } from "./Lushu-grid/utils";

type TranslationFn = (text: string) => string;

export async function buildFullNumerologyExportSections({
  dob,
  fullName,
  gender,
  language,
  t
}: NumerologyPayload & {
  language: LanguageCode;
  t: TranslationFn;
}): Promise<NumerologyExportSection[]> {
  const payload = { dob, fullName, gender };
  const currentYear = new Date().getFullYear();
  const [
    loShu,
    personalYear,
    matrix,
    vedicGrid,
    pythagorasGrid,
    nameTable,
    nameChart,
    pairEvents,
    letterAnalysis,
    runningAgeAlphabet
  ] = await Promise.all([
    safeExportValue("Lo Shu grid", getLoShuGrid(payload), null),
    safeExportValue("personal year", getPersonalYear(payload), null),
    safeExportValue("personal year matrix", getPersonalYearMatrix(dob, currentYear, currentYear + 10), []),
    safeExportValue("Vedic grid", getVedicGrid(payload), null),
    safeExportValue("Pythagorean grid", getPythagoreanGrid(payload), null),
    safeExportValue("Pythagorean name table", getPythagoreanNameTable(fullName, 90), null),
    safeExportValue("name chart", getNameFrequencyNameChart(payload), null),
    safeExportValue("name pair events", getChaldeanNamePairEvents(fullName), null),
    safeExportValue("name letter analysis", getChaldeanNameLetterAnalysisChart(fullName), null),
    dob ? safeExportValue("running age alphabet", getPythagoreanRunningAgeAlphabet(payload), []) : Promise.resolve([])
  ]);
  const personalityNo = Number(loShu?.driverNumber);
  const destinyNo = Number(loShu?.destinyNumber);
  const vedicPersonalityNo = Number(vedicGrid?.driverNumber);
  const vedicDestinyNo = Number(vedicGrid?.destinyNumber);
  const repetitionPayload = loShu?.counts ? buildLoShuCountsPayload(loShu.counts) : null;
  const [
    relationships,
    sectorEffects,
    repetitionEffects,
    vedicRelationships,
    { buildLoShuExportSections },
    { buildVedicExportSections },
    { buildPythagorasExportSections },
    { buildNameFrequencyExportSections, loadNameLetterRelationships }
  ] = await Promise.all([
    Number.isFinite(personalityNo) && Number.isFinite(destinyNo)
      ? safeExportValue("Lo Shu relationships", getNumberRelationships(personalityNo, destinyNo), [])
      : Promise.resolve([]),
    Number.isFinite(personalityNo) && Number.isFinite(destinyNo)
      ? safeExportValue("sector effects", getSectorWiseEffects(personalityNo, destinyNo), null)
      : Promise.resolve(null),
    repetitionPayload ? safeExportValue("repetition effects", getLoShuRepetitionEffects(repetitionPayload), []) : Promise.resolve([]),
    Number.isFinite(vedicPersonalityNo) && Number.isFinite(vedicDestinyNo)
      ? safeExportValue("Vedic relationships", getNumberRelationships(vedicPersonalityNo, vedicDestinyNo), [])
      : Promise.resolve([]),
    import("./Lushu-grid/NumerologyResultScreen"),
    import("./Vedic-grid"),
    import("./Pythoras"),
    import("./NameFrequency")
  ]);
  const nameLetterRelationships = nameChart
    ? await safeExportValue("name letter relationships", loadNameLetterRelationships(nameChart), [])
    : [];
  const [loShuSections, vedicSections, pythagorasSections, nameFrequencySections] = await Promise.all([
    safeExportValue("Lo Shu export sections", buildLoShuExportSections({
      dob,
      fullName,
      gender,
      language,
      t,
      loShu,
      matrix,
      personalYear,
      relationships,
      repetitionEffects,
      sectorEffects,
      sectorTranslating: false
    }), []),
    safeExportValue("Vedic export sections", buildVedicExportSections({ dob, fullName, gender, language, relationships: vedicRelationships, t, vedicGrid }), []),
    safeExportValue("Pythagoras export sections", buildPythagorasExportSections({ dob, fullName, gender, language, nameTable, pythagorasGrid, t }), []),
    safeExportValue("Name Frequency export sections", buildNameFrequencyExportSections({
      dob,
      fullName,
      gender,
      language,
      letterAnalysis,
      loShuGrid: loShu,
      nameChart,
      nameLetterRelationships,
      pairEvents,
      runningAgeAlphabet,
      t
    }), [])
  ]);

  return [
    ...loShuSections,
    ...vedicSections,
    ...pythagorasSections,
    ...nameFrequencySections
  ];
}

async function safeExportValue<T>(label: string, promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    console.warn(`Skipping ${label} in numerology PDF export`, err);
    return fallback;
  }
}
