import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { routeForNotification } from "@/features/notifications/routing";
import type { Enums } from "@/types/database";
import { registerForPushNotificationsAsync } from "./register";
import { savePushToken } from "./api";

type Role = Enums<"user_role">;

// In foreground non mostriamo il banner OS: il toast di NotificationsListener
// (realtime) copre già quel caso → niente doppia notifica. In background/killed
// è l'OS a mostrare la push, questo handler non interviene.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Registra il push token dell'utente e gestisce il deep-link al tap sulla push.
 * Senza UI, montato app-wide accanto a NotificationsListener/RealtimeSync quando
 * c'è `session && profile`. Best-effort: la registrazione non blocca mai l'app.
 */
export function PushRegistrar({ role }: { role: Role }) {
  const router = useRouter();
  // Ruolo in un ref: il listener del tap non va ri-registrato al cambio ruolo.
  const roleRef = useRef(role);
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  // Registra (una volta) il token del device.
  useEffect(() => {
    let active = true;
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (!active || !token) return;
      try {
        await savePushToken(token);
      } catch {
        // Best-effort: un errore di registrazione non deve rompere l'app.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Deep-link al tap sulla push (in foreground/background e all'apertura da app
  // uccisa via getLastNotificationResponseAsync).
  useEffect(() => {
    function handle(response: Notifications.NotificationResponse | null) {
      const data = response?.notification.request.content.data as
        | { type?: string; related_id?: string | null }
        | undefined;
      if (!data?.type) return;
      const href = routeForNotification(
        roleRef.current,
        data.type as Enums<"notification_type">,
        data.related_id ?? null
      );
      if (href) router.push(href);
    }

    Notifications.getLastNotificationResponseAsync().then(handle);
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [router]);

  return null;
}
