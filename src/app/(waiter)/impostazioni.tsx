import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, View } from "@/tw";
import { GhostButton } from "@/components/ui/GhostButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAuth } from "@/lib/auth";

export default function WaiterSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-5 pb-2">
        <ScreenHeader eyebrow="Account" title="Impostazioni" />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 24,
          gap: 16,
        }}
      >
        <GhostButton label="Esci" onPress={signOut} />
      </ScrollView>
    </View>
  );
}
