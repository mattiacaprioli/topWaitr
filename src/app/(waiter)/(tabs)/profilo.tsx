import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { Display } from "@/components/ui/Display";
import { GhostButton } from "@/components/ui/GhostButton";
import { Mono } from "@/components/ui/Mono";
import { Pill } from "@/components/ui/Pill";
import { useAuth } from "@/lib/auth";

export default function WaiterProfiloScreen() {
  const insets = useSafeAreaInsets();
  const { session, profile, signOut } = useAuth();
  const name = profile?.full_name ?? "Cameriere";

  return (
    <ScrollView
      className="flex-1 bg-bg-0"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 96,
        gap: 24,
      }}
    >
      <View>
        <Mono gold>Profilo</Mono>
        <Display className="mt-1 text-4xl">{name}</Display>
      </View>

      <View className="items-center gap-3 rounded-3xl border border-border-2 bg-bg-card p-6">
        <Avatar name={name} size={72} />
        <Pill label="Cameriere" variant="tag" />
        {session?.user.email ? (
          <Text className="text-sm text-t3">{session.user.email}</Text>
        ) : null}
      </View>

      <GhostButton label="Esci" onPress={signOut} />
    </ScrollView>
  );
}
