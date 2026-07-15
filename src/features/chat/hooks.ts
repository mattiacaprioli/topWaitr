import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  MESSAGES_PAGE_SIZE,
  getChatUnreadCount,
  getConversation,
  getConversations,
  getMessagesPage,
  getOrCreateConversation,
  markConversationRead,
  sendMessage,
  type Message,
} from "./api";

export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: qk.chat.conversations(userId ?? ""),
    queryFn: () => getConversations(userId as string),
    enabled: !!userId,
  });
}

/** Conversazione con controparte, per l'header del thread. */
export function useConversation(
  conversationId: string | undefined,
  userId: string | undefined
) {
  return useQuery({
    queryKey: qk.chat.conversation(conversationId ?? ""),
    queryFn: () => getConversation(conversationId as string, userId as string),
    enabled: !!conversationId && !!userId,
  });
}

/** Conteggio non letti per il badge del tab Messaggi. */
export function useChatUnreadCount(userId: string | undefined) {
  return useQuery({
    queryKey: qk.chat.unread(userId ?? ""),
    queryFn: () => getChatUnreadCount(userId as string),
    enabled: !!userId,
  });
}

export function useMessagesInfinite(conversationId: string | undefined) {
  return useInfiniteQuery({
    queryKey: qk.chat.messages(conversationId ?? ""),
    queryFn: ({ pageParam }) =>
      getMessagesPage(conversationId as string, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < MESSAGES_PAGE_SIZE ? undefined : allPages.length,
    enabled: !!conversationId,
  });
}

/**
 * Inserisce un messaggio in testa alla prima pagina della cache del thread.
 * Dedupe per id: l'echo realtime e l'onSuccess della mutation sono idempotenti.
 */
export function appendMessageToCache(qc: QueryClient, message: Message) {
  qc.setQueryData<InfiniteData<Message[]>>(
    qk.chat.messages(message.conversation_id),
    (data) => {
      if (!data) return data;
      if (data.pages.some((page) => page.some((m) => m.id === message.id))) {
        return data;
      }
      return {
        ...data,
        pages: [[message, ...data.pages[0]], ...data.pages.slice(1)],
      };
    }
  );
}

export function useSendMessage(conversationId: string, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      sendMessage(conversationId, userId, content),
    onSuccess: (message) => {
      appendMessageToCache(qc, message);
      qc.invalidateQueries({ queryKey: qk.chat.conversationsAll });
    },
  });
}

export function useMarkConversationRead(conversationId: string, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.chat.unread(userId) });
      qc.invalidateQueries({ queryKey: qk.chat.conversations(userId) });
      // La RPC marca letta anche la notifica 'new_message' della conversazione.
      qc.invalidateQueries({ queryKey: qk.notifications.all });
    },
  });
}

/** Apre (o crea) la conversazione; la navigazione la fa lo screen chiamante. */
export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: getOrCreateConversation,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.chat.conversationsAll }),
  });
}
