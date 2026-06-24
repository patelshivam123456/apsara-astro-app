import { FeatureListScreen } from "@/components/FeatureListScreen";

export function CallScreen() {
  return (
    <FeatureListScreen
      title="Audio & Video Call"
      subtitle="Call requests follow the same wallet-aware consultation workflow from the Next.js app."
      icon="phone-in-talk"
      items={["Audio call requests", "Video call requests", "Wallet balance check", "Consultation history"]}
    />
  );
}
