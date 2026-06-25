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
      <Stack.Screen name="index" options={{ title: "topWaitr" }} />
    </Stack>
  );
}
