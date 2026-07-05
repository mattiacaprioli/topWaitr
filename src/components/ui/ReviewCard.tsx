import { Text, View } from "@/tw";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { Review } from "@/features/reviews/types";
import { Pill } from "./Pill";
import { StarRating } from "./StarRating";

/** A single customer review (as shown on the waiter's public profile). */
export function ReviewCard({
  review,
  className,
}: {
  review: Review;
  className?: string;
}) {
  const who = review.reviewer_name?.trim() || "Anonimo";
  return (
    <View
      className={cn(
        "gap-2 rounded-2xl border border-border bg-bg-card p-4",
        className
      )}
    >
      <View className="flex-row items-center justify-between">
        <StarRating value={review.rating} size={14} readOnly />
        <Text className="text-xs text-t3">
          {who} · {formatDate(review.created_at.slice(0, 10))}
        </Text>
      </View>
      {review.comment ? (
        <Text className="text-sm leading-5 text-t2">“{review.comment}”</Text>
      ) : null}
      {review.tags.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {review.tags.map((t) => (
            <Pill key={t} label={t} variant="tag" />
          ))}
        </View>
      ) : null}
    </View>
  );
}
