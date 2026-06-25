import { View, Text } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { GoldButton } from "@/components/ui/GoldButton";
import { Pill } from "@/components/ui/Pill";
import { useAuth } from "@/lib/auth";

export default function WaiterHome() {
  const { profile, signOut } = useAuth();
  return (
    <View className="flex-1 bg-bg-1 p-6">
      <View className="flex-row items-center gap-3">
        <Avatar name={profile?.full_name ?? "Cameriere"} size={56} />
        <View>
          <Text className="text-lg font-sans-bold text-t1">
            {profile?.full_name ?? "Cameriere"}
          </Text>
          <Pill label="Cameriere" variant="accepted" />
        </View>
      </View>

      <Text className="mt-8 text-base text-t2">
        Area cameriere. Qui troverai e ti candiderai ai turni (M5).
      </Text>

      <View className="mt-auto">
        <GoldButton label="Esci" onPress={signOut} />
      </View>
    </View>
  );
}
