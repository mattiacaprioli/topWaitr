import { FloatingTabBar } from "@/components/nav/FloatingTabBar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Pressable, View } from "@/tw";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICONS: Record<string, IconName> = {
  index: "home",
  turni: "search",
  messaggi: "message",
  pro: "sparkle",
  profilo: "user",
};

/** Floating QR action — fixed bottom-right above the tab bar on every main screen. */
function QRFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBottom = insets.bottom > 0 ? insets.bottom : 16;
  return (
    <Pressable
      onPress={() => router.push("/(waiter)/qr")}
      hitSlop={8}
      style={{
        position: "absolute",
        right: 24,
        bottom: tabBottom + 64 + 14,
        width: 56,
        height: 56,
        borderRadius: 999,
        boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
      }}
    >
      <LinearGradient
        colors={["#F5C765", "#D9A23F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          flex: 1,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="qr" size={28} color="#1A1206" strokeWidth={1.8} />
      </LinearGradient>
    </Pressable>
  );
}

export default function WaiterTabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} icons={ICONS} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="turni" options={{ title: "Turni" }} />
        <Tabs.Screen name="messaggi" options={{ title: "Messaggi" }} />
        <Tabs.Screen name="pro" options={{ title: "Pro" }} />
        <Tabs.Screen name="profilo" options={{ title: "Profilo" }} />
      </Tabs>
      <QRFab />
    </View>
  );
}
