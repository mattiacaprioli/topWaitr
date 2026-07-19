import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { NotificationSettings } from "@/features/notifications/NotificationSettings";
import { ScrollView, View } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WaiterNotificationSettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-5 pb-2">
        <ScreenHeader eyebrow="Impostazioni" title="Notifiche" />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <NotificationSettings />
      </ScrollView>
    </View>
  );
}
