import { Pressable, Text, View } from "@/tw";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  className,
}: Props) {
  return (
    <View
      className={cn("mb-3 flex-row items-center justify-between", className)}
    >
      <Text className="text-lg font-bold text-t1">{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction}>
          <Text className="text-sm font-semibold text-gold">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
