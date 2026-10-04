import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { ActivityIndicator, LogBox, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { PlayerProvider, usePlayers } from "@/src/context/PlayerContext";
import { queryClient } from "@/src/query-client";
import { useTheme } from "@/src/theme";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

function RootNavigator() {
  const { ready } = usePlayers();
  const { colors } = useTheme();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
        }}
      >
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  // One app level ErrorBoundary; a render crash shows a reload screen
  // instead of a blank app.
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <SafeAreaProvider>
            <PlayerProvider>
              <RootNavigator />
            </PlayerProvider>
          </SafeAreaProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
