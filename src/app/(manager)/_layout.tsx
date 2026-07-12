import { Stack } from "expo-router";

export default function ManagerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0C0907" },
        headerTintColor: "#F8F4ED",
        headerTitleStyle: { color: "#F8F4ED" },
        contentStyle: { backgroundColor: "#0C0907" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="venue" options={{ title: "Il tuo locale" }} />
      <Stack.Screen name="shift/new" options={{ title: "Nuovo turno" }} />
      <Stack.Screen name="shift/[id]" options={{ title: "Turno" }} />
      <Stack.Screen name="shift/edit/[id]" options={{ title: "Modifica turno" }} />
      <Stack.Screen name="staff/new" options={{ title: "Aggiungi allo staff" }} />
      <Stack.Screen name="staff/[id]" options={{ title: "Scheda staff" }} />
      <Stack.Screen name="cameriere/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="notifiche" options={{ headerShown: false }} />
    </Stack>
  );
}
