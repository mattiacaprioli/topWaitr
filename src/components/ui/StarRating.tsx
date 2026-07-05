import { Pressable, View } from "@/tw";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

const GOLD = "#EAB54C";
const EMPTY = "#5A5348";

type Props = {
  /** Current rating 0–5. */
  value: number;
  /** Provide to make the stars tappable (input mode). Omit for display-only. */
  onChange?: (n: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
};

/** 1–5 star control. Interactive when `onChange` is set and not `readOnly`. */
export function StarRating({
  value,
  onChange,
  size = 22,
  readOnly,
  className,
}: Props) {
  const interactive = !!onChange && !readOnly;
  return (
    <View className={cn("flex-row", className)} style={{ gap: size * 0.14 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        const glyph = (
          <Icon
            name={filled ? "star" : "starOutline"}
            size={size}
            color={filled ? GOLD : EMPTY}
            strokeWidth={1.4}
          />
        );
        return interactive ? (
          <Pressable key={i} hitSlop={6} onPress={() => onChange!(i)}>
            {glyph}
          </Pressable>
        ) : (
          <View key={i}>{glyph}</View>
        );
      })}
    </View>
  );
}
