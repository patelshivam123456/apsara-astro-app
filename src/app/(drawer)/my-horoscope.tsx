import { FeatureListScreen } from "@/components/FeatureListScreen";
export default function MyHoroscope() {
  return <FeatureListScreen title="My Horoscope" subtitle="Saved horoscope and birth details." items={["Birth profile", "Daily horoscope", "Saved reports"]} icon="zodiac-aries" />;
}
