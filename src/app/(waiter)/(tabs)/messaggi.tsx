import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "@/tw";
import { Display } from "@/components/ui/Display";
import { Mono } from "@/components/ui/Mono";
import { ConversationList } from "@/features/chat/ConversationList";
import { useAuth } from "@/lib/auth";

export default function WaiterMessaggiScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session!.user.id;

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 12 }}>
      <View className="px-5 pb-2">
        <Mono gold>Chat</Mono>
        <Display className="mt-1 text-4xl">Messaggi</Display>
      </View>
      <ConversationList
        userId={userId}
        onOpen={(id) => router.push(`/(waiter)/chat/${id}`)}
        bottomInset={insets.bottom + 96}
      />
    </View>
  );
}
