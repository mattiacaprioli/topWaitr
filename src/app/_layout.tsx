import "@/global.css";

import { Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";

SplashScreen.preventAutoHideAsync();

const screenOptions = {
  headerStyle: { backgroundColor: "#0A0A0F" },
  headerTintColor: "#FFFFFF",
  contentStyle: { backgroundColor: "#0A0A0F" },
} as const;

function RootNavigator() {
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  const isManager = !!session && profile?.role === "manager";
  const isWaiter = !!session && profile?.role === "waiter";

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={isManager}>
        <Stack.Screen name="(manager)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={isWaiter}>
        <Stack.Screen name="(waiter)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Screen name="(dev)/components" options={{ title: "Design System" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
