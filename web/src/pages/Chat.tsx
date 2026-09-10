import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useConversations } from "@/features/chat/hooks";
import { useChatThread } from "@/features/chat/useChatThread";
import { timeAgo, toTimeString } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  Button,
  Input,
  PageHeader,
  Placeholder,
  QueryError,
  Spinner,
} from "../ui/primitives";

/**
 * Messaggi: lista conversazioni a sinistra, thread aperto a destra. Sul telefono
 * sono due schermate; su desktop stanno insieme, così si risponde a più persone
 * senza tornare indietro ogni volta.
 */
export function ChatPage() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isPending, isError, error } = useConversations(userId);

  if (isPending) return <Spinner />;
  if (isError) return <QueryError error={error} />;

  const conversations = data ?? [];

  return (
    <>
      <PageHeader title="Messaggi" />

      {conversations.length === 0 ? (
        <Placeholder
          title="Nessuna conversazione"
          detail="Le chat nascono dai turni: scrivi a un candidato dalle Candidature o a una persona del tuo staff."
        />
      ) : (
        <div className="grid h-[calc(100dvh-12rem)] grid-cols-[20rem_1fr] gap-6">
          <div className="flex flex-col gap-2 overflow-y-auto pr-1">
            {conversations.map((c) => {
              const active = c.id === id;
              const mine = c.lastMessage?.sender_id === userId;
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/chat/${c.id}`)}
                  className={cn(
                    "focus-gold shrink-0 rounded-2xl border p-3 text-left transition",
                    active
                      ? "border-border-gold bg-gold/10"
                      : "border-border-2 bg-bg-card hover:bg-bg-1"
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-t1">
                      {c.other.name}
                    </span>
                    {c.lastMessage ? (
                      <span className="shrink-0 text-[11px] text-t4">
                        {timeAgo(c.lastMessage.created_at)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-t3">
                      {c.lastMessage
                        ? `${mine ? "Tu: " : ""}${c.lastMessage.content}`
                        : "Nessun messaggio"}
                    </span>
                    {c.unreadCount > 0 ? (
                      <span className="shrink-0 rounded-full bg-gold px-1.5 text-[11px] font-bold text-gold-ink">
                        {c.unreadCount > 9 ? "9+" : c.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {id ? (
            <Thread key={id} conversationId={id} userId={userId} />
          ) : (
            <Placeholder
              title="Scegli una conversazione"
              detail="Selezionala dall'elenco a sinistra."
            />
          )}
        </div>
      )}
    </>
  );
}

function Thread({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) {
  const [text, setText] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Messaggi deduplicati, canale realtime e mark-read vengono dall'hook
  // condiviso con l'app: qui c'è solo la UI.
  const { query, messages, other, notFound, send, submit } = useChatThread(
    conversationId,
    userId
  );

  // I messaggi arrivano dal più recente: si mostrano invertiti, e si scende in
  // fondo a ogni nuovo arrivo.
  const ordered = [...messages].reverse();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (notFound) {
    return (
      <Placeholder
        title="Conversazione non trovata"
        detail="Questa conversazione non è più disponibile."
      />
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const invalid = submit(text, {
      onSuccess: () => setText(""),
      onError: () => setSendError("Messaggio non inviato. Riprova."),
    });
    setSendError(invalid);
  }

  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-border-2 bg-bg-card">
      <header className="border-b border-border px-5 py-3">
        <p className="text-sm font-semibold text-t1">
          {other?.name ?? " "}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {query.isError ? (
          <QueryError error={query.error} />
        ) : query.isLoading ? (
          <Spinner />
        ) : ordered.length === 0 ? (
          <p className="py-12 text-center text-sm text-t3">
            {other
              ? `Scrivi il primo messaggio a ${other.name}.`
              : "Scrivi il primo messaggio."}
          </p>
        ) : (
          <>
            {query.hasNextPage ? (
              <div className="mb-4 flex justify-center">
                <Button
                  onClick={() => query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                >
                  {query.isFetchingNextPage
                    ? "Caricamento…"
                    : "Messaggi precedenti"}
                </Button>
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              {ordered.map((m) => {
                const own = m.sender_id === userId;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[70%] rounded-2xl px-3.5 py-2.5",
                      own
                        ? "self-end rounded-br-md bg-gold text-gold-ink"
                        : "self-start rounded-bl-md bg-bg-2 text-t1"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    <p
                      className={cn(
                        "mt-1 text-right font-mono text-[10px] opacity-70",
                        own ? "text-gold-ink" : "text-t4"
                      )}
                    >
                      {toTimeString(new Date(m.created_at))}
                    </p>
                  </div>
                );
              })}
            </div>
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Scrivi un messaggio…"
        />
        <Button
          type="submit"
          variant="gold"
          disabled={!text.trim() || send.isPending}
        >
          Invia
        </Button>
      </form>
      {sendError ? (
        <p className="px-4 pb-3 text-xs text-error">{sendError}</p>
      ) : null}
    </div>
  );
}
