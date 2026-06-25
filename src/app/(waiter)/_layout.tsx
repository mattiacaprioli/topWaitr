import { Stack } from "expo-router";
import { Pressable, Text } from "@/tw";
import { useAuth } from "@/lib/auth";

export default function WaiterLayout() {
  const { signOut } = useAuth();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0C0907" },
        headerTintColor: "#F8F4ED",
        contentStyle: { backgroundColor: "#0C0907" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Turni disponibili",
          headerRight: () => (
            <Pressable onPress={signOut} hitSlop={8}>
              <Text className="text-sm font-sans-semibold text-t3">Esci</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="shift/[id]" options={{ title: "Dettaglio turno" }} />
    </Stack>
  );
}
