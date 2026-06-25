import { Stack } from "expo-router";

export default function WaiterLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0A0A0F" },
        headerTintColor: "#FFFFFF",
        contentStyle: { backgroundColor: "#0A0A0F" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "topWaitr" }} />
    </Stack>
  );
}
