import { Pressable, Text } from "@/tw";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
};

/** Outlined pill button (the prototype's .btn-ghost). */
export function GhostButton({ label, onPress, disabled, className }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        "items-center rounded-full border border-border-2 px-5 py-3.5",
        disabled && "opacity-50",
        className
      )}
    >
      <Text className="font-sans-medium text-base text-t1">{label}</Text>
    </Pressable>
  );
}
