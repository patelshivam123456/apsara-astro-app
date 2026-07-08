import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { router } from "expo-router";

import { LanguageSelector } from "@/components/LanguageSelector";
import { colors } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
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
  ["settings", "Settings", "cog"],
] as const;

export default function DrawerLayout() {
  const signOut = useAuthStore((state) => state.signOut);
  const { t } = useTranslation();

  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        drawerActiveTintColor: colors.amber,
        drawerInactiveTintColor: colors.cocoa,
        drawerStyle: { backgroundColor: colors.cream },
        headerRight: () => <LanguageSelector />,
        headerRightContainerStyle: { paddingRight: 12 },
      }}
    >
      {drawerItems.map(([name, title, icon]) => (
        <Drawer.Screen
          key={name}
          name={name}
          options={{
            title: t(title),
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
                color={color}
                size={size}
              />
            ),
          }}
        />
      ))}

      <Drawer.Screen
        name="logout"
        listeners={{
          drawerItemPress: async (event) => {
            event.preventDefault();
            await signOut();
            router.replace("/(auth)/login");
          },
        }}
        options={{
          title: t("Logout"),
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="logout" color={color} size={size} />
          ),
        }}
      />
    </Drawer>
  );
}
