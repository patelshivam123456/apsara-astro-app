import { FeatureListScreen } from "@/components/FeatureListScreen";

export function RemedyScreen() {
  return (
    <FeatureListScreen
      title="Remedies"
      subtitle="Rituals, reports, and suggested remedies for client consultations."
      icon="flower"
      items={["Personalized remedies", "E-Pooja bookings", "Gemstone suggestions", "Report follow-ups"]}
    />
  );
}
