import { FeatureListScreen } from "@/components/FeatureListScreen";

export default function Language() {
  return <FeatureListScreen title="Language" subtitle="Choose preferred app language." items={["English", "Hindi", "Regional language ready"]} icon="translate" />;
}
