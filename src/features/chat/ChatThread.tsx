import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Pressable, Text, TextInput, View } from "@/tw";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { QueryError } from "@/components/ui/QueryError";
import { toTimeString } from "@/lib/format";
import { qk } from "@/lib/queryKeys";
import { useKeyboardVisible } from "@/lib/useKeyboardVisible";
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
          "mt-1 self-end text-[10px] opacity-70",
          own ? "text-gold-ink" : "text-t4"
        )}
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
  const keyboardVisible = useKeyboardVisible();

  const conversation = useConversation(conversationId, userId);
  const query = useMessagesInfinite(conversationId);
  // La paginazione a offset + il prepend dei nuovi messaggi in cache fa
  // riapparire la riga di confine nella pagina successiva: dedupe per id.
  const messages = useMemo(() => {
    const seen = new Set<string>();
    const out: Message[] = [];
    for (const m of query.data?.pages.flat() ?? []) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      out.push(m);
    }
    return out;
  }, [query.data]);
  const send = useSendMessage(conversationId, userId);
  const markRead = useMarkConversationRead(conversationId, userId);
  const markReadMutate = markRead.mutate;

  // Marca letto solo quando c'è davvero qualcosa da leggere (all'apertura o a
  // ogni messaggio ricevuto): evita RPC/invalidazioni a vuoto. onSuccess del
  // hook aggiorna read_at in cache, quindi hasUnread torna false e non ri-scatta.
  const hasUnread = useMemo(
    () => messages.some((m) => m.sender_id !== userId && m.read_at == null),
    [messages, userId]
  );
  useEffect(() => {
    if (hasUnread) markReadMutate();
  }, [hasUnread, markReadMutate]);

  // Canale realtime del thread: appende in cache i nuovi messaggi (dedupe per
  // id, quindi l'eco dei propri invii è innocuo).
  useEffect(() => {
    // postgres_changes non rigioca gli eventi persi: alla ri-sottoscrizione
    // (riconnessione dopo un buco / ritorno in foreground) rifacciamo il fetch
    // dei messaggi. La prima sottoscrizione ha già i dati dalla query.
    let firstSubscribe = true;
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
          // L'append aggiorna hasUnread; l'effetto sopra marca letto se serve.
          appendMessageToCache(qc, payload.new as Message);
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        if (firstSubscribe) {
          firstSubscribe = false;
          return;
        }
        qc.invalidateQueries({ queryKey: qk.chat.messages(conversationId) });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);

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

  // Conversazione inesistente/senza accesso (es. tap su una notifica la cui
  // conversazione è stata rimossa): stato chiaro invece di un thread morto.
  const notFound = !conversationId || (conversation.isFetched && !conversation.data);
  if (notFound) {
    return (
      <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
        <View className="px-5">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-12 w-12 items-center justify-center rounded-full border border-border-2 bg-bg-2"
          >
            <Icon name="chevL" size={22} color="#F8F4ED" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState
            title="Conversazione non trovata"
            subtitle="Questa conversazione non è più disponibile."
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-0" style={{ paddingTop: insets.top + 8 }}>
      {/* "padding" anche su Android: con l'edge-to-edge di SDK 54+ adjustResize
          non ridimensiona più la finestra, quindi senza behavior la tastiera
          copre composer e ultimi messaggi. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View className="flex-row items-center gap-3 border-b border-border px-5 pb-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full border border-border-2 bg-bg-2"
          >
            <Icon name="chevL" size={18} color="#F8F4ED" />
          </Pressable>
          {other ? (
            <>
              <Avatar
                uri={other.avatarUrl ?? undefined}
                name={other.name}
                size={40}
              />
              <Text
                className="flex-1 text-lg font-sans-bold text-t1"
                numberOfLines={1}
              >
                {other.name}
              </Text>
            </>
          ) : (
            // Placeholder neutro finché non arriva la controparte (niente "?").
            <>
              <View className="h-10 w-10 rounded-full bg-bg-2" />
              <View className="h-4 w-40 rounded-full bg-bg-2" />
            </>
          )}
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
          // A tastiera aperta l'inset inferiore è coperto: tenerlo lascerebbe
          // un buco vuoto tra composer e tastiera.
          style={{ paddingBottom: keyboardVisible ? 12 : insets.bottom + 12 }}
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
