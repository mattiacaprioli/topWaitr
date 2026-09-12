import { FloatingTabBar } from "@/components/nav/FloatingTabBar";
import { type IconName } from "@/components/ui/Icon";
import { useChatUnreadCount } from "@/features/chat/hooks";
import { useAuth } from "@/lib/auth";
import { View } from "@/tw";
import { Tabs } from "expo-router";

const ICONS: Record<string, IconName> = {
  index: "home",
  turni: "calendar",
  messaggi: "message",
  profilo: "user",
};

export default function WaiterTabsLayout() {
  const { session } = useAuth();
  const unread = useChatUnreadCount(session?.user.id).data ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => (
          <FloatingTabBar {...props} icons={ICONS} badges={{ messaggi: unread }} />
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="turni" options={{ title: "Turni" }} />
        <Tabs.Screen name="messaggi" options={{ title: "Messaggi" }} />
        <Tabs.Screen name="profilo" options={{ title: "Profilo" }} />
      </Tabs>
    </View>
  );
}
