import { FeatureListScreen } from "@/components/FeatureListScreen";
export default function Settings() {
  return <FeatureListScreen title="Settings" subtitle="Account, notifications, security, and dark mode." items={["Notifications", "Security", "Theme"]} icon="cog" />;
}
