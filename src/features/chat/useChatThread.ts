import { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabase";
import type { Message } from "./api";
import {
  appendMessageToCache,
  useConversation,
  useMarkConversationRead,
  useMessagesInfinite,
  useSendMessage,
} from "./hooks";
import { messageSchema } from "./schema";

/**
 * Logica di un thread di chat, senza UI: messaggi deduplicati, canale realtime,
 * mark-read automatico e invio validato.
 *
 * Headless di proposito — la usano sia `ChatThread.tsx` (React Native) sia la
 * dashboard web. Le regole qui dentro sono sottili (dedupe per id, refetch alla
 * ri-sottoscrizione, mark-read solo quando serve) e nascono tutte da bug reali:
 * duplicarle in due UI significherebbe due fonti di verità che divergono.
 */
export function useChatThread(conversationId: string, userId: string) {
  const qc = useQueryClient();

  const conversation = useConversation(conversationId, userId);
  const query = useMessagesInfinite(conversationId);
  const send = useSendMessage(conversationId, userId);
  const markRead = useMarkConversationRead(conversationId, userId);
  const markReadMutate = markRead.mutate;

  // La paginazione keyset + il prepend dei nuovi messaggi in cache può far
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

  /**
   * Valida e invia. Ritorna l'errore di validazione da mostrare (stringa) o
   * `null` se l'invio è partito: la presentazione (toast, alert, testo inline)
   * la sceglie la UI.
   */
  const submit = useCallback(
    (
      text: string,
      handlers?: { onSuccess?: () => void; onError?: () => void }
    ): string | null => {
      const parsed = messageSchema.safeParse({ content: text });
      if (!parsed.success) return parsed.error.issues[0].message;
      send.mutate(parsed.data.content, handlers);
      return null;
    },
    [send]
  );

  // Conversazione inesistente/senza accesso (es. apertura di una notifica la cui
  // conversazione è stata rimossa): stato chiaro invece di un thread morto.
  const notFound =
    !conversationId || (conversation.isFetched && !conversation.data);

  return {
    conversation,
    other: conversation.data?.other,
    query,
    messages,
    notFound,
    send,
    submit,
    markRead,
  };
}
