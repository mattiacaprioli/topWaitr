import type { FallbackProps } from "react-error-boundary";
import { Text, View } from "@/tw";
import { Display } from "@/components/ui/Display";
import { GoldButton } from "@/components/ui/GoldButton";

/** Recoverable fallback shown when a screen subtree throws. */
export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message =
    error instanceof Error ? error.message : "Errore imprevisto.";
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-bg-0 px-8">
      <Display className="text-center text-[22px]">Qualcosa è andato storto</Display>
      <Text className="text-center font-sans text-sm text-t3">{message}</Text>
      <GoldButton label="Riprova" onPress={resetErrorBoundary} />
    </View>
  );
}
