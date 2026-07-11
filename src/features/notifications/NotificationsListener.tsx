import { useEffect } from "react";
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
            const title = (payload.new as { title?: string }).title;
            if (title) toast.show(title, "info");
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
