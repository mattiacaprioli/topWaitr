import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useNotificationsRealtime } from "@/features/notifications/useNotificationsRealtime";
import { useToast } from "./ui/Toast";

/**
 * Equivalente web di `NotificationsListener`: stesso hook condiviso, con la
 * rotta di react-router e il toast del web. Nessuna UI.
 */
export function NotificationsWatcher({ userId }: { userId: string }) {
  const { pathname } = useLocation();
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
