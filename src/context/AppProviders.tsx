import { PropsWithChildren, useEffect, useMemo } from "react";
import { useColorScheme } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { darkTheme, lightTheme } from "@/constants/theme";
import { LanguageProvider } from "@/context/LanguageContext";
import { useAuthStore } from "@/store/auth.store";

export function AppProviders({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60_000
          }
        }
      }),
    []
  );

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={scheme === "dark" ? darkTheme : lightTheme}>
          <LanguageProvider>{children}</LanguageProvider>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
