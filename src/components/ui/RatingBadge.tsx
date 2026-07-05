import { Text, View } from "@/tw";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

type Props = {
  avg: number | null;
  count: number | null;
  className?: string;
};

/** Inline reputation: "★ 4,8 · 142 recensioni" (IT decimal comma). */
export function RatingBadge({ avg, count, className }: Props) {
  const c = count ?? 0;
  if (c === 0) {
    return (
      <View className={cn("flex-row items-center gap-1", className)}>
        <Icon name="starOutline" size={13} color="#5A5348" />
        <Text className="text-xs text-t3">Nessuna recensione</Text>
      </View>
    );
  }
  const avgLabel = (avg ?? 0).toFixed(1).replace(".", ",");
  return (
    <View className={cn("flex-row items-center gap-1", className)}>
      <Icon name="star" size={13} color="#EAB54C" />
      <Text className="text-sm font-sans-semibold text-t1">{avgLabel}</Text>
      <Text className="text-xs text-t3">
        · {c} {c === 1 ? "recensione" : "recensioni"}
      </Text>
    </View>
  );
}
