import { Stack } from "expo-router";

export default function WaiterLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0C0907" },
        headerTintColor: "#F8F4ED",
        contentStyle: { backgroundColor: "#0C0907" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="shift/[id]"
        options={{ title: "Dettaglio turno", headerBackTitle: "Turni" }}
      />
      <Stack.Screen name="candidature" options={{ headerShown: false }} />
      <Stack.Screen name="profilo-edit" options={{ headerShown: false }} />
      <Stack.Screen name="qr" options={{ headerShown: false }} />
      <Stack.Screen name="impostazioni" options={{ headerShown: false }} />
    </Stack>
  );
}
