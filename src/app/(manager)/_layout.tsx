import { Stack } from "expo-router";

export default function ManagerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0A0A0F" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { color: "#FFFFFF" },
        contentStyle: { backgroundColor: "#0A0A0F" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "topWaitr" }} />
      <Stack.Screen name="venue" options={{ title: "Il tuo locale" }} />
      <Stack.Screen name="shift/new" options={{ title: "Nuovo turno" }} />
      <Stack.Screen name="shift/[id]" options={{ title: "Turno" }} />
    </Stack>
  );
}
