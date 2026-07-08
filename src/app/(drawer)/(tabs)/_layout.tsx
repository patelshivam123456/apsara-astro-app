import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colors } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.cocoa,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border }
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("Home"), tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="chat" options={{ title: t("Chat"), tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chat" size={22} color={color} /> }} />
      <Tabs.Screen name="call" options={{ title: t("Call"), tabBarIcon: ({ color }) => <MaterialCommunityIcons name="phone" size={22} color={color} /> }} />
      <Tabs.Screen name="remedy" options={{ title: t("Remedy"), tabBarIcon: ({ color }) => <MaterialCommunityIcons name="flower" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: t("Profile"), tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={22} color={color} /> }} />
    </Tabs>
  );
}
