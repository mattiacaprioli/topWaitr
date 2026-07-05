import { useEffect } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { View } from "@/tw";
import { Animated } from "@/tw/animated";
import { cn } from "@/lib/cn";

type Props = {
  /** Avanzamento 0..1. */
  progress: number;
  className?: string;
};

/** Barra di avanzamento sottile: track scuro + porzione gold animata. */
export function ProgressBar({ progress, className }: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const value = useSharedValue(clamped);

  useEffect(() => {
    value.value = withTiming(clamped, { duration: 300 });
  }, [clamped, value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${value.value * 100}%`,
  }));

  return (
    <View
      className={cn("h-1 overflow-hidden rounded-full bg-bg-2", className)}
    >
      <Animated.View style={fillStyle} className="h-full rounded-full bg-gold" />
    </View>
  );
}
