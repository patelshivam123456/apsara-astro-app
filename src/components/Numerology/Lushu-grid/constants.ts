import { MaterialCommunityIcons } from "@expo/vector-icons";

import { type LanguageCode } from "@/context/LanguageContext";
import { SectorWiseEffectsResponse } from "@/services/numerology.service";

export type Calculation = "lo-shu-grid" | "vedic-grid" | "pythagoras-grid" | "name-frequency" | "daily-numeroscope";
export type SectorEffectTab = "career" | "health" | "finance" | "relationship";

export const months = [
  ["Jan", "January", 1],
  ["Feb", "February", 2],
  ["Mar", "March", 3],
  ["Apr", "April", 4],
  ["May", "May", 5],
  ["Jun", "June", 6],
  ["Jul", "July", 7],
  ["Aug", "August", 8],
  ["Sep", "September", 9],
  ["Oct", "October", 10],
  ["Nov", "November", 11],
  ["Dec", "December", 12]
] as const;

export const defaultGrid = {
  topRow: ["4", "9", "2"],
  middleRow: ["3", "5", "7"],
  bottomRow: ["8", "1", "6"]
};

export const defaultGridCells = [defaultGrid.topRow, defaultGrid.middleRow, defaultGrid.bottomRow].flat();

export const sectorEffectTabs: {
  key: SectorEffectTab;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  dataKey: keyof Pick<SectorWiseEffectsResponse, "careerEffect" | "healthEffect" | "financeEffect" | "relationshipEffect">;
}[] = [
  { key: "career", title: "Career", icon: "briefcase", color: "#148f36", dataKey: "careerEffect" },
  { key: "health", title: "Health", icon: "heart-pulse", color: "#d71920", dataKey: "healthEffect" },
  { key: "finance", title: "Finance", icon: "cash", color: "#1967d2", dataKey: "financeEffect" },
  { key: "relationship", title: "Relationship", icon: "heart-broken", color: "#c2187a", dataKey: "relationshipEffect" }
];

export const personalYearNotes = [
  "Your running personal year shows where effort and results will concentrate.",
  "This year rewards consistent hard work and practical planning.",
  "A favourable time to buy, sell, or recover pending funds.",
  "Avoid business expansion until the existing venture is stronger.",
  "Useful connections may be established through focused communication."
];

export const detailSections = [
  ["coreCharacteristics", "Core Characteristics"],
  ["commonPitfalls", "Common Pitfalls"],
  ["primaryHealthVulnerabilities", "Primary Health Vulnerabilities"],
  ["topCareerRoles", "Top Career Roles"],
  ["topCareerSectors", "Top Career Sectors"]
] as const;

export const detailSectionOrder: string[] = detailSections.map(([key]) => key);

export const localizedDigits: Record<LanguageCode, string[]> = {
  en: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  hi: ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"],
  mr: ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"],
  bn: ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"],
  ta: ["௦", "௧", "௨", "௩", "௪", "௫", "௬", "௭", "௮", "௯"],
  te: ["౦", "౧", "౨", "౩", "౪", "౫", "౬", "౭", "౮", "౯"]
};
