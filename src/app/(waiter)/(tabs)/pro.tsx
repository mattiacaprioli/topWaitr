import { View } from "@/tw";
import { EmptyState } from "@/components/ui/EmptyState";

export default function WaiterProScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-bg-0 px-8">
      <EmptyState
        title="topWaitr PRO"
        subtitle="Le funzioni premium per i camerieri arriveranno presto."
      />
    </View>
  );
}
