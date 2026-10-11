import { Redirect } from "expo-router";

export default function ClientTabsIndex() {
  return <Redirect href="/(drawer)/(tabs)/profile" />;
}
