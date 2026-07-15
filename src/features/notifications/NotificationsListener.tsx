import { useEffect, useRef } from "react";
import { usePathname } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { qk } from "@/lib/queryKeys";
import { useToast } from "@/providers/Toast";

/**
 * Listener realtime montato app-wide: apre un canale sulle notifiche dell'utente,
 * invalida le query di notifica ad ogni cambiamento e mostra un toast sui nuovi
 * arrivi. Nessuna UI. Realtime rispetta la RLS "notifications: own only", quindi
 * riceve solo le righe dell'utente.
 */
export function NotificationsListener({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  // Rotta corrente in un ref: serve nel callback realtime senza ri-sottoscrivere
  // il canale ad ogni navigazione.
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

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
          if (payload.eventType === "INSERT") {
            const n = payload.new as {
              title?: string;
              type?: string;
              related_id?: string | null;
            };
            // Se stai già leggendo quella conversazione, niente toast.
            const inThisChat =
              n.type === "new_message" &&
              !!n.related_id &&
              pathnameRef.current === `/chat/${n.related_id}`;
            if (n.title && !inThisChat) toast.show(n.title, "info");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc, toast]);

  return null;
}
