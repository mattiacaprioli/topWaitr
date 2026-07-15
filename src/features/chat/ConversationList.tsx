import { useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl } from "react-native";
import { Pressable, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { QueryError } from "@/components/ui/QueryError";
import { timeAgo } from "@/lib/format";
import type { ConversationListItem } from "./api";
import { useConversations } from "./hooks";

function ConversationRow({
  item,
  userId,
  onPress,
}: {
  item: ConversationListItem;
  userId: string;
  onPress: () => void;
}) {
  const preview = item.lastMessage
    ? (item.lastMessage.sender_id === userId ? "Tu: " : "") +
      item.lastMessage.content
    : "Nessun messaggio";

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-3xl border border-border-2 bg-bg-card p-4"
    >
      <Avatar
        uri={item.other.avatarUrl ?? undefined}
        name={item.other.name}
        size={48}
      />
      <View className="flex-1">
        <Text className="text-base font-sans-bold text-t1" numberOfLines={1}>
          {item.other.name}
        </Text>
        <Text className="mt-0.5 text-sm text-t3" numberOfLines={1}>
          {preview}
        </Text>
      </View>
      <View className="items-end gap-1.5">
        <Text className="text-[11px] text-t4">
          {timeAgo(item.lastMessage?.created_at ?? item.created_at)}
        </Text>
        {item.unreadCount > 0 ? (
          <View className="h-4.5 min-w-4.5 items-center justify-center rounded-full bg-gold px-1">
            <Text className="font-sans-bold text-[10px] text-gold-ink">
              {item.unreadCount > 9 ? "9+" : String(item.unreadCount)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

type Props = {
  userId: string;
  onOpen: (conversationId: string) => void;
  bottomInset?: number;
};

/** Lista conversazioni, condivisa tra il tab Messaggi cameriere e ristoratore. */
export function ConversationList({ userId, onOpen, bottomInset = 24 }: Props) {
  const query = useConversations(userId);
  const items = query.data ?? [];

  // Spinner legato solo al pull dell'utente: agganciarlo a isRefetching lo fa
  // apparire (e su iOS incastrare) ad ogni invalidation realtime in background.
  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() {
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  }

  if (query.isError) {
    return (
      <View className="flex-1 justify-center px-6">
        <QueryError onRetry={() => query.refetch()} />
      </View>
    );
  }

  if (query.isLoading) {
    return <ActivityIndicator color="#EAB54C" style={{ marginTop: 40 }} />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: bottomInset,
        gap: 12,
        flexGrow: 1,
      }}
      renderItem={({ item }) => (
        <ConversationRow
          item={item}
          userId={userId}
          onPress={() => onOpen(item.id)}
        />
      )}
      ListEmptyComponent={
        <View className="flex-1 justify-center">
          <EmptyState
            title="Nessun messaggio"
            subtitle="Le conversazioni con i tuoi contatti appariranno qui."
          />
        </View>
      }
      refreshControl={
        <RefreshControl
          tintColor="#EAB54C"
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    />
  );
}
