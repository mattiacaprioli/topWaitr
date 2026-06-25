import type { StyleProp, TextStyle } from "react-native";
import { Text } from "@/tw";
import { cn } from "@/lib/cn";
import { FontFamily } from "@/constants/fonts";

type Props = {
  children: React.ReactNode;
  /** Gold eyebrow instead of the default tertiary tone. */
  gold?: boolean;
  className?: string;
  style?: StyleProp<TextStyle>;
};

/**
 * Eyebrow / metadata label — IBM Plex Mono, uppercase, wide tracking.
 * letterSpacing is set inline because RN expects px, not the em Tailwind emits.
 */
export function Mono({ children, gold, className, style }: Props) {
  return (
    <Text
      className={cn(
        "text-[10.5px] uppercase",
        gold ? "text-gold" : "text-t3",
        className
      )}
      style={[{ fontFamily: FontFamily.mono, letterSpacing: 1.4 }, style]}
    >
      {children}
    </Text>
  );
}
