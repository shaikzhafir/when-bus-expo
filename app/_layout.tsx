import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="bus-stop/[code]" options={{ headerShown: false }} />
        <Stack.Screen
          name="bus-route/[serviceNo]"
          options={{ headerShown: false }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
