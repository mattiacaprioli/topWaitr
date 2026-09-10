import { useCallback } from "react";
import { usePathname } from "expo-router";
import { useToast } from "@/providers/Toast";
import { useNotificationsRealtime } from "./useNotificationsRealtime";

/**
 * Listener realtime montato app-wide: apre un canale sulle notifiche dell'utente,
 * invalida le query di notifica ad ogni cambiamento e mostra un toast sui nuovi
 * arrivi. Nessuna UI. Realtime rispetta la RLS "notifications: own only", quindi
 * riceve solo le righe dell'utente.
 *
 * La logica del canale sta in `useNotificationsRealtime`, condivisa con la
 * dashboard web; qui restano solo i pezzi specifici di React Native (rotta da
 * Expo Router, toast del provider).
 */
export function NotificationsListener({ userId }: { userId: string }) {
  const pathname = usePathname();
  const toast = useToast();

  useNotificationsRealtime({
    userId,
    currentPath: pathname,
    onNotify: useCallback(
      (n) => {
        if (n.title) toast.show(n.title, "info");
      },
      [toast]
    ),
  });

  return null;
}
