import { LinearGradient } from "expo-linear-gradient";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Pressable, Text } from "@/tw";
import { Animated } from "@/tw/animated";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
};

export function GoldButton({ label, onPress, disabled, className }: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
      className={className}
    >
      <Animated.View
        style={animStyle}
        className={cn("overflow-hidden rounded-2xl", disabled && "opacity-50")}
      >
        <LinearGradient
          colors={["#F5D076", "#D4A843", "#B8892E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingVertical: 16,
            paddingHorizontal: 24,
            alignItems: "center",
          }}
        >
          <Text className="text-base font-bold text-bg-1">{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}
