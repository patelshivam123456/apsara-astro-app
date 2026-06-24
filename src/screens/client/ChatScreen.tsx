import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { clientChats } from "@/services/chat.service";

export function ChatScreen() {
  return (
    <Screen>
      {clientChats.map((chat) => (
        <View key={chat.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium">{chat.name}</Text>
            <Text style={styles.muted}>{chat.topic} • {chat.date}</Text>
          </View>
          <Button mode="contained-tonal">{chat.status}</Button>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md },
  muted: { color: colors.cocoa }
});
