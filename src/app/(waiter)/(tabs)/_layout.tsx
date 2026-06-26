import { Icon, type IconName } from "@/components/ui/Icon";
import { Pressable, Text, View } from "@/tw";
import { FontFamily } from "@/constants/fonts";
import { palette } from "@/constants/colors";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";

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

export default function WaiterTabsLayout() {
  return (
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
  );
}
