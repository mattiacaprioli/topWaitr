import "@/global.css";

import { Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SystemUI from "expo-system-ui";
import { useFonts } from "expo-font";
import { Fraunces_400Regular } from "@expo-google-fonts/fraunces/400Regular";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces/600SemiBold";
import { Fraunces_400Regular_Italic } from "@expo-google-fonts/fraunces/400Regular_Italic";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { IBMPlexMono_400Regular } from "@expo-google-fonts/ibm-plex-mono/400Regular";
import { IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono/500Medium";
import { AuthProvider, useAuth } from "@/lib/auth";

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync("#0C0907");

const BG = "#0C0907";

const screenOptions = {
  headerStyle: { backgroundColor: BG },
  headerTintColor: "#F8F4ED",
  contentStyle: { backgroundColor: BG },
} as const;

function RootNavigator() {
  const { session, profile, loading } = useAuth();

  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  const ready = !loading && fontsLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

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
