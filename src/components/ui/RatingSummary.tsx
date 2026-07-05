import { Text, View } from "@/tw";
import { cn } from "@/lib/cn";
import type { RatingBreakdown } from "@/features/reviews/types";
import { Icon } from "./Icon";
import { StarRating } from "./StarRating";

const STARS = [5, 4, 3, 2, 1] as const;

/** Reputation summary: big average + total + per-star distribution bars. */
export function RatingSummary({
  avg,
  count,
  breakdown,
  className,
}: {
  avg: number | null;
  count: number | null;
  breakdown: RatingBreakdown | undefined;
  className?: string;
}) {
  const total = count ?? 0;
  const avgLabel = total > 0 ? (avg ?? 0).toFixed(1).replace(".", ",") : "—";
  const max = Math.max(1, ...STARS.map((s) => breakdown?.[s] ?? 0));

  return (
    <View
      className={cn(
        "flex-row gap-5 rounded-3xl border border-border-2 bg-bg-card p-5",
        className
      )}
    >
      <View className="items-center justify-center">
        <Text
          className="text-4xl font-sans-bold text-t1"
          style={{ letterSpacing: -1 }}
        >
          {avgLabel}
        </Text>
        <StarRating
          value={Math.round(avg ?? 0)}
          size={13}
          readOnly
          className="mt-1"
        />
        <Text className="mt-1 text-xs text-t3">
          {total} {total === 1 ? "recensione" : "recensioni"}
        </Text>
      </View>

      <View className="flex-1 justify-center gap-1.5">
        {STARS.map((s) => {
          const c = breakdown?.[s] ?? 0;
          const pct = `${(c / max) * 100}%` as const;
          return (
            <View key={s} className="flex-row items-center gap-2">
              <Text className="w-3 text-right text-xs text-t3">{s}</Text>
              <Icon name="star" size={10} color="#EAB54C" />
              <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-2">
                <View
                  className="h-full rounded-full bg-gold"
                  style={{ width: pct }}
                />
              </View>
              <Text className="w-6 text-right text-xs text-t3">{c}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
