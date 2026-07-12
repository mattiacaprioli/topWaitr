import { Icon, type IconName } from "@/components/ui/Icon";
import { palette } from "@/constants/colors";
import { FontFamily } from "@/constants/fonts";
import { Pressable, Text, View } from "@/tw";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";

const GOLD = palette.gold;
const INACTIVE = palette.textMuted;

export type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

/**
 * Floating, rounded pill tab bar — full control over spacing/centering.
 * Shared across roles; pass an `icons` map (route name → IconName).
 */
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  insets,
  icons,
}: TabBarProps & { icons: Record<string, IconName> }) {
  return (
    <View
      style={{
        position: "absolute",
        left: 10,
        right: 10,
        bottom: insets.bottom > 0 ? insets.bottom : 16,
        height: 64,
        flexDirection: "row",
        borderRadius: 20,
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
        const iconName = icons[route.name] ?? "home";

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
