import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { qk } from "@/lib/queryKeys";

export type IncomingNotification = {
  title?: string;
  type?: string;
  related_id?: string | null;
};

/**
 * Canale realtime delle notifiche dell'utente: invalida le query a ogni
 * cambiamento e segnala i nuovi arrivi tramite `onNotify`.
 *
 * Headless — la usano sia `NotificationsListener` (React Native, toast di
 * `@/providers/Toast`) sia la dashboard web, che ha un proprio toast. Il
 * chiamante passa il percorso corrente perché la regola "niente avviso se stai
 * già leggendo quella conversazione" deve valere su entrambi: le due rotte hanno
 * per fortuna la stessa forma (`/chat/<id>`).
 */
export function useNotificationsRealtime({
  userId,
  currentPath,
  onNotify,
}: {
  userId: string;
  currentPath: string;
  onNotify: (notification: IncomingNotification) => void;
}) {
  // Ref per non ricreare il canale a ogni navigazione o re-render.
  const pathRef = useRef(currentPath);
  useEffect(() => {
    pathRef.current = currentPath;
  }, [currentPath]);

  const notifyRef = useRef(onNotify);
  useEffect(() => {
    notifyRef.current = onNotify;
  }, [onNotify]);

  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          qc.invalidateQueries({ queryKey: qk.notifications.all });
          if (payload.eventType !== "INSERT") return;
          const n = payload.new as IncomingNotification;
          // Se stai già leggendo quella conversazione, niente avviso.
          const inThisChat =
            n.type === "new_message" &&
            !!n.related_id &&
            pathRef.current === `/chat/${n.related_id}`;
          if (n.title && !inThisChat) notifyRef.current(n);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}
