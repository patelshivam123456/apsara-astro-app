import { FeatureListScreen } from "@/components/FeatureListScreen";
export default function OrderHistory() {
  return <FeatureListScreen title="Order History" subtitle="Reports, remedies, and store purchases." items={["Report orders", "Store orders", "Remedy orders"]} icon="clipboard-list" />;
}
