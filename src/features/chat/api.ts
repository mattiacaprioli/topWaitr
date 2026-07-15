import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export const MESSAGES_PAGE_SIZE = 30;

export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;

/**
 * Controparte della conversazione. La RLS di `profiles` non permette il join
 * diretto tra i partecipanti: l'identità del cameriere arriva dalla view
 * `waiter_public_cards`, quella del ristoratore dal suo locale (`venues`,
 * public read) — che è anche la UX giusta: si chatta con "Trattoria da Mario".
 */
export type ChatCounterpart = {
  name: string;
  avatarUrl: string | null;
};

export type ConversationListItem = Conversation & {
  other: ChatCounterpart;
  lastMessage: Pick<Message, "content" | "created_at" | "sender_id"> | null;
  unreadCount: number;
};

export type ConversationDetail = Conversation & { other: ChatCounterpart };

async function fetchWaiterCards(
  ids: string[]
): Promise<Map<string, ChatCounterpart>> {
  const out = new Map<string, ChatCounterpart>();
  if (ids.length === 0) return out;
  const { data, error } = await supabase
    .from("waiter_public_cards")
    .select("id, full_name, avatar_url")
    .in("id", ids);
  if (error) throw new Error(error.message);
  for (const w of data ?? []) {
    if (w.id) out.set(w.id, { name: w.full_name ?? "Cameriere", avatarUrl: w.avatar_url });
  }
  return out;
}

async function fetchVenueOwners(
  ids: string[]
): Promise<Map<string, ChatCounterpart>> {
  const out = new Map<string, ChatCounterpart>();
  if (ids.length === 0) return out;
  const { data, error } = await supabase
    .from("venues")
    .select("owner_id, name, logo_url")
    .in("owner_id", ids);
  if (error) throw new Error(error.message);
  for (const v of data ?? []) {
    if (!out.has(v.owner_id)) {
      out.set(v.owner_id, { name: v.name, avatarUrl: v.logo_url });
    }
  }
  return out;
}

/**
 * Controparte per OGNI conversazione (chiave = id conversazione). La stessa
 * persona può essere cameriere in una conversazione e proprietario di un locale
 * in un'altra: si risolve per lato della conversazione, non per profilo.
 */
async function getCounterparts(
  userId: string,
  conversations: Conversation[]
): Promise<Map<string, ChatCounterpart>> {
  const waiterIds = new Set<string>();
  const managerIds = new Set<string>();
  for (const c of conversations) {
    if (c.waiter_id !== userId) waiterIds.add(c.waiter_id);
    if (c.manager_id !== userId) managerIds.add(c.manager_id);
  }

  const [byWaiter, byManager] = await Promise.all([
    fetchWaiterCards([...waiterIds]),
    fetchVenueOwners([...managerIds]),
  ]);

  const out = new Map<string, ChatCounterpart>();
  for (const c of conversations) {
    const other =
      c.waiter_id === userId
        ? byManager.get(c.manager_id)
        : byWaiter.get(c.waiter_id);
    if (other) out.set(c.id, other);
  }
  return out;
}

const FALLBACK_COUNTERPART: ChatCounterpart = { name: "Utente", avatarUrl: null };

/** Le conversazioni dell'utente con controparte, ultimo messaggio e non letti. */
export async function getConversations(
  userId: string
): Promise<ConversationListItem[]> {
  const { data, error } = await supabase
    .from("conversations")
    // !inner: escludi le conversazioni senza messaggi (create al tap di
    // "Contatta" ma mai iniziate) — non devono comparire nella lista.
    .select(
      "*, last:messages!inner(content, created_at, sender_id), unread:messages(count)"
    )
    .or(`waiter_id.eq.${userId},manager_id.eq.${userId}`)
    .order("created_at", { ascending: false, referencedTable: "last" })
    .limit(1, { referencedTable: "last" })
    .is("unread.read_at", null)
    .neq("unread.sender_id", userId);
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const others = await getCounterparts(userId, rows);
  return rows
    .map(({ last, unread, ...conversation }) => ({
      ...conversation,
      other: others.get(conversation.id) ?? FALLBACK_COUNTERPART,
      lastMessage: last[0] ?? null,
      unreadCount: unread[0]?.count ?? 0,
    }))
    .sort((a, b) =>
      (b.lastMessage?.created_at ?? b.created_at).localeCompare(
        a.lastMessage?.created_at ?? a.created_at
      )
    );
}

/** Singola conversazione con controparte (header del thread). */
export async function getConversation(
  conversationId: string,
  userId: string
): Promise<ConversationDetail | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const others = await getCounterparts(userId, [data]);
  return {
    ...data,
    other: others.get(data.id) ?? FALLBACK_COUNTERPART,
  };
}

async function findConversation(
  waiterId: string,
  managerId: string
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("waiter_id", waiterId)
    .eq("manager_id", managerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Una conversazione per coppia (indice unico waiter+manager). Niente upsert:
 * non va sovrascritto lo shift_id storico del primo contatto.
 */
export async function getOrCreateConversation(params: {
  waiterId: string;
  managerId: string;
  shiftId?: string | null;
}): Promise<Conversation> {
  const existing = await findConversation(params.waiterId, params.managerId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      waiter_id: params.waiterId,
      manager_id: params.managerId,
      shift_id: params.shiftId ?? null,
    })
    .select("*")
    .single();
  if (!error) return data;

  // Race sull'indice unico: un'altra sessione l'ha creata un attimo prima.
  if (error.code === "23505") {
    const retry = await findConversation(params.waiterId, params.managerId);
    if (retry) return retry;
  }
  throw new Error(error.message);
}

/** Pagina di messaggi, dal più recente (per la FlatList inverted). */
export async function getMessagesPage(
  conversationId: string,
  page: number
): Promise<Message[]> {
  const from = page * MESSAGES_PAGE_SIZE;
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .range(from, from + MESSAGES_PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Il destinatario non può aggiornare read_at direttamente (policy "messages:
 * sender update"): passa dalla RPC DEFINER, che marca letta anche la notifica.
 */
export async function markConversationRead(
  conversationId: string
): Promise<void> {
  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation: conversationId,
  });
  if (error) throw new Error(error.message);
}

/** Messaggi non letti totali (badge tab Messaggi). La RLS limita ai propri. */
export async function getChatUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .is("read_at", null)
    .neq("sender_id", userId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
