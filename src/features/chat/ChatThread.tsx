import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Pressable, Text, TextInput, View } from "@/tw";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { QueryError } from "@/components/ui/QueryError";
import { toTimeString } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/providers/Toast";
import type { Message } from "./api";
import {
  appendMessageToCache,
  useConversation,
  useMarkConversationRead,
  useMessagesInfinite,
  useSendMessage,
} from "./hooks";
import { messageSchema } from "./schema";

function MessageBubble({ message, own }: { message: Message; own: boolean }) {
  return (
    <View
      className={cn(
        "max-w-[80%] rounded-2xl px-3.5 py-2.5",
        own
          ? "self-end rounded-br-md bg-gold"
          : "self-start rounded-bl-md bg-bg-2"
      )}
    >
      <Text className={cn("text-[15px]", own ? "text-gold-ink" : "text-t1")}>
        {message.content}
      </Text>
      <Text
        className={cn(
          "mt-1 self-end text-[10px]",
          own ? "text-gold-ink" : "text-t4"
        )}
        style={{ opacity: 0.7 }}
      >
        {toTimeString(new Date(message.created_at))}
      </Text>
    </View>
  );
}

type Props = {
  conversationId: string;
  userId: string;
};

/** Thread di chat 1:1, condiviso tra le schermate cameriere e ristoratore. */
export function ChatThread({ conversationId, userId }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [text, setText] = useState("");

  const conversation = useConversation(conversationId, userId);
  const query = useMessagesInfinite(conversationId);
  const messages = query.data?.pages.flat() ?? [];
  const send = useSendMessage(conversationId, userId);
  const markRead = useMarkConversationRead(conversationId, userId);
  const markReadMutate = markRead.mutate;

  // I messaggi già a schermo vengono marcati letti entrando (e rientrando).
  useFocusEffect(
    useCallback(() => {
      markReadMutate();
    }, [markReadMutate])
  );

  // Canale realtime del thread: appende in cache i nuovi messaggi (dedupe per
  // id, quindi l'eco dei propri invii è innocuo) e marca letti quelli altrui.
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.new as Message;
          appendMessageToCache(qc, message);
          if (message.sender_id !== userId) markReadMutate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, qc, markReadMutate]);

  const canSend = text.trim().length > 0 && !send.isPending;

  const onSend = () => {
    const parsed = messageSchema.safeParse({ content: text });
    if (!parsed.success) {
      toast.show(parsed.error.issues[0].message, "error");
      return;
    }
    send.mutate(parsed.data.content, {
      onSuccess: () => setText(""),
      onError: () => toast.show("Messaggio non inviato. Riprova.", "error"),
    });
  };

  const other = conversation.data?.other;

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-center gap-3 border-b border-border px-5 pb-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full border border-border-2 bg-bg-2"
          >
            <Icon name="chevL" size={18} color="#F8F4ED" />
          </Pressable>
          <Avatar
            uri={other?.avatarUrl ?? undefined}
            name={other?.name ?? "?"}
            size={40}
          />
          <Text className="flex-1 text-lg font-sans-bold text-t1" numberOfLines={1}>
            {other?.name ?? "Conversazione"}
          </Text>
        </View>

        {query.isError ? (
          <View className="flex-1 justify-center px-6">
            <QueryError onRetry={() => query.refetch()} />
          </View>
        ) : query.isLoading ? (
          <ActivityIndicator color="#EAB54C" style={{ flex: 1 }} />
        ) : (
          <FlatList
            // Inverted solo con dati: ListEmptyComponent altrimenti va a testa in giù.
            inverted={messages.length > 0}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} own={item.sender_id === userId} />
            )}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 8,
              flexGrow: 1,
            }}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (query.hasNextPage && !query.isFetchingNextPage) {
                query.fetchNextPage();
              }
            }}
            ListFooterComponent={
              query.isFetchingNextPage ? (
                <ActivityIndicator
                  color="#EAB54C"
                  style={{ marginVertical: 16 }}
                />
              ) : null
            }
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-8">
                <Text className="text-center text-base font-sans-bold text-t1">
                  Inizia la conversazione
                </Text>
                <Text className="mt-1 text-center text-sm text-t3">
                  {other
                    ? `Scrivi il primo messaggio a ${other.name}.`
                    : "Scrivi il primo messaggio."}
                </Text>
              </View>
            }
          />
        )}

        <View
          className="flex-row items-end gap-2 border-t border-border px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <TextInput
            className="max-h-28 flex-1 rounded-[14px] border border-border bg-bg-1 px-4 py-3 font-sans text-[16px] text-t1"
            placeholder="Scrivi un messaggio…"
            placeholderTextColor="#6A6358"
            multiline
            value={text}
            onChangeText={setText}
          />
          <Pressable
            onPress={onSend}
            disabled={!canSend}
            className={cn(
              "h-12 w-12 items-center justify-center rounded-full",
              canSend ? "bg-gold" : "border border-border-2 bg-bg-2"
            )}
          >
            <Icon name="send" size={20} color={canSend ? "#1A1206" : "#6A6358"} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
