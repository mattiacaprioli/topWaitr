import { Text, View } from "@/tw";
import { cn } from "@/lib/cn";
import { Display } from "./Display";
import { GoldButton } from "./GoldButton";
import { Icon } from "./Icon";

/** Empty state for a waiter with zero reviews yet — nudges them to show the QR. */
export function NoReviews({
  onOpenQR,
  className,
}: {
  onOpenQR: () => void;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "items-center gap-4 rounded-3xl border border-border-2 bg-bg-card px-6 py-8",
        className
      )}
      style={{ borderStyle: "dashed" }}
    >
      <View className="h-16 w-16 items-center justify-center rounded-2xl border border-border-2 bg-bg-2">
        <Icon name="star" size={30} color="#EAB54C" />
      </View>
      <View className="items-center gap-1.5">
        <Display className="text-center text-2xl">
          Nessuna recensione ancora
        </Display>
        <Text
          className="text-center text-sm leading-5 text-t3"
          style={{ maxWidth: 300 }}
        >
          Mostra il QR ai tuoi clienti a fine servizio: ogni recensione
          verificata fa crescere la tua Aura.
        </Text>
      </View>
      <GoldButton label="Apri il mio QR" onPress={onOpenQR} />
    </View>
  );
}
