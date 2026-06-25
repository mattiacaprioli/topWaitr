import { View } from "@/tw";
import { EmptyState } from "./EmptyState";
import { GoldButton } from "./GoldButton";

type Props = {
  onRetry: () => void;
  title?: string;
  subtitle?: string;
  className?: string;
};

/** Recoverable error state for a failed query. Mirrors the EmptyState look. */
export function QueryError({
  onRetry,
  title = "Qualcosa è andato storto",
  subtitle = "Non siamo riusciti a caricare i dati. Controlla la connessione e riprova.",
  className,
}: Props) {
  return (
    <View className={className}>
      <EmptyState title={title} subtitle={subtitle} />
      <GoldButton className="mt-2" label="Riprova" onPress={onRetry} />
    </View>
  );
}
