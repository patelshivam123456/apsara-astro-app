import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { useWalletStore } from "@/store/wallet.store";

export function WalletScreen() {
  const { t } = useTranslation();
  const { balance, transactions, addMoney } = useWalletStore();
  return (
    <Screen>
      <View style={styles.balance}>
        <Text variant="labelLarge" style={styles.muted}>{t("Wallet Balance")}</Text>
        <Text variant="displaySmall">₹{balance}</Text>
        <Button mode="contained" onPress={() => addMoney(200)}>{t("Add ₹200")}</Button>
      </View>
      {transactions.map((item) => (
        <View key={item.id} style={styles.row}>
          <View>
            <Text variant="titleSmall">{t(item.desc)}</Text>
            <Text style={styles.muted}>{t(item.date)}</Text>
          </View>
          <Text style={{ color: item.amount >= 0 ? colors.success : colors.danger }}>₹{item.amount}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balance: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.xl, gap: spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md },
  muted: { color: colors.cocoa }
});
