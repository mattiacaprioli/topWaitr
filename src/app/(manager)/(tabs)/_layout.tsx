import { FloatingTabBar } from "@/components/nav/FloatingTabBar";
import type { IconName } from "@/components/ui/Icon";
import { Tabs } from "expo-router";

const ICONS: Record<string, IconName> = {
  index: "home",
  turni: "calendar",
  messaggi: "message",
  staff: "users",
  profilo: "user",
};

export default function ManagerTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} icons={ICONS} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="turni" options={{ title: "Turni" }} />
      <Tabs.Screen name="messaggi" options={{ title: "Messaggi" }} />
      <Tabs.Screen name="staff" options={{ title: "Staff" }} />
      <Tabs.Screen name="profilo" options={{ title: "Profilo" }} />
    </Tabs>
  );
}
