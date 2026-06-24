import { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "@/constants/theme";

type Props = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
}>;

export function Screen({ children, scroll = true, padded = true }: Props) {
  const content = <View style={[styles.content, padded && styles.padded]}>{children}</View>;

  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1 },
  content: { flex: 1 },
  padded: { padding: spacing.lg, gap: spacing.lg }
});
