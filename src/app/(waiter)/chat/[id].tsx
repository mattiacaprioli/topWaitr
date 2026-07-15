import { useLocalSearchParams } from "expo-router";
import { ChatThread } from "@/features/chat/ChatThread";
import { useAuth } from "@/lib/auth";

export default function WaiterChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();

  return <ChatThread conversationId={id} userId={session!.user.id} />;
}
