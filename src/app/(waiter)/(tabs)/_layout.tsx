import { Icon, type IconName } from "@/components/ui/Icon";
import { palette } from "@/constants/colors";
import { FontFamily } from "@/constants/fonts";
import { Pressable, Text, View } from "@/tw";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GOLD = palette.gold;
const INACTIVE = palette.textMuted;

const ICONS: Record<string, IconName> = {
  index: "home",
  turni: "search",
  messaggi: "message",
  pro: "sparkle",
  profilo: "user",
};

type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

/** Floating, rounded pill tab bar — full control over spacing/centering. */
function WaiterTabBar({ state, descriptors, navigation, insets }: TabBarProps) {
  return (
    <View
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        bottom: insets.bottom > 0 ? insets.bottom : 16,
        height: 64,
        flexDirection: "row",
        borderRadius: 30,
        borderCurve: "continuous",
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.hairline,
        boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label = (options.title ?? route.name) as string;
        const iconName = ICONS[route.name] ?? "home";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Icon name={iconName} size={22} color={focused ? GOLD : INACTIVE} />
            <Text
              numberOfLines={1}
              style={{
                color: focused ? GOLD : INACTIVE,
                fontFamily: FontFamily.mono,
                fontSize: 10,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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
        tabBar={(props) => <WaiterTabBar {...props} />}
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
