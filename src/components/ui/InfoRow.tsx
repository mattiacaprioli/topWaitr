import { Text, View } from "@/tw";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string;
  /** Valore in gold (es. il compenso). */
  gold?: boolean;
  /** Prima riga della card: niente bordo superiore. */
  first?: boolean;
};

/** Riga label→valore nelle card info (dettaglio turno cameriere e ristoratore). */
export function InfoRow({ label, value, gold, first }: Props) {
  return (
    <View
      className={cn(
        "flex-row items-center justify-between py-3.5",
        !first && "border-t border-border"
      )}
    >
      <Text className="shrink-0 text-sm text-t3">{label}</Text>
      <Text
        className={cn(
          "ml-3 flex-1 text-right text-sm font-sans-semibold",
          gold ? "text-gold" : "text-t1"
        )}
      >
        {value}
      </Text>
    </View>
  );
}
