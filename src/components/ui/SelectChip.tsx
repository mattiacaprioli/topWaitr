import { Pressable, Text } from "@/tw";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  className?: string;
};

/**
 * Selectable pill for the shift form — role / day / badge filters.
 * Flat gold fill when active, hairline outline otherwise (mono uppercase,
 * matching the Aura prototype).
 */
export function SelectChip({ label, active, onPress, className }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "rounded-full border px-5 py-3",
        active ? "border-gold bg-gold" : "border-border-2 bg-transparent",
        className
      )}
    >
      <Text
        className={cn(
          "font-mono text-[11px] uppercase",
          active ? "text-gold-ink" : "text-t2"
        )}
        style={{ letterSpacing: 1.4 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
