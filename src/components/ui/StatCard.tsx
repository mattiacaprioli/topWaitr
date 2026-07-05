import { Text, View } from "@/tw";
import { cn } from "@/lib/cn";
import { Mono } from "./Mono";

/** Compact metric cell (value + mono label). Used in the home stat strip and profile stats. */
export function StatCard({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "flex-1 rounded-2xl border border-border bg-bg-2 px-3.5 pb-3 pt-3.5",
        className
      )}
    >
      <Text
        className="text-2xl font-sans-bold text-t1"
        style={{ letterSpacing: -0.5 }}
      >
        {value}
      </Text>
      <Mono className="mt-1.5">{label}</Mono>
    </View>
  );
}
