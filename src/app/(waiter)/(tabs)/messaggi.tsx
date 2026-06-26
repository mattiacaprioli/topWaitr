import { View } from "@/tw";
import { EmptyState } from "@/components/ui/EmptyState";

export default function WaiterMessaggiScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-bg-0 px-8">
      <EmptyState
        title="Messaggi in arrivo"
        subtitle="La chat con i ristoratori sarà disponibile a breve."
      />
    </View>
  );
}
