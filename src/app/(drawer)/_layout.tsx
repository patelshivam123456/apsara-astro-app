import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";

import { colors } from "@/constants/theme";
import { useAuthStore } from "@/store/auth.store";

const drawerItems = [
  ["(tabs)", "Home", "home"],
  ["language", "Language", "translate"],
  ["my-horoscope", "My Horoscope", "zodiac-aries"],
  ["numerology", "Numerology", "numeric"],
  ["tarot-reading", "Tarot Reading", "cards"],
  ["vastu-consultation", "Vastu Consultation", "home-city"],
  ["palmist-consultation", "Palmist Consultation", "hand-front-right"],
  ["graphologist-consultation", "Graphologist Consultation", "pencil"],
  ["gift-cards", "Gift Cards", "gift"],
  ["wallet-history", "Wallet History", "wallet"],
  ["order-history", "Order History", "clipboard-list"],
  ["remedies", "Remedies", "flower"],
  ["store", "Store", "shopping"],
  ["customer-care", "Customer Care", "headset"],
  ["settings", "Settings", "cog"]
] as const;

export default function DrawerLayout() {
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        drawerActiveTintColor: colors.amber,
        drawerInactiveTintColor: colors.cocoa,
        drawerStyle: { backgroundColor: colors.cream }
      }}
    >
      {drawerItems.map(([name, title, icon]) => (
        <Drawer.Screen
          key={name}
          name={name}
          options={{
            title,
            headerShown: name === "numerology" ? false : undefined,
            swipeEnabled: name === "numerology" ? false : undefined,
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} color={color} size={size} />
            )
          }}
        />
      ))}
      <Drawer.Screen
        name="logout"
        listeners={{
          drawerItemPress: (event) => {
            event.preventDefault();
            signOut().finally(() => router.replace("/(auth)/login"));
          }
        }}
        options={{
          title: "Logout",
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="logout" color={color} size={size} />
        }}
      />
    </Drawer>
  );
}
