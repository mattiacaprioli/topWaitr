import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0C0907" },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
