import type { Href } from "expo-router";
import type { Enums } from "@/types/database";

type Role = Enums<"user_role">;
type NotificationType = Enums<"notification_type">;

/**
 * Rotta da aprire per una notifica, in base al ruolo e al tipo. Fonte unica usata
 * sia dagli screen Notifiche (`onOpen`) sia dal tap sulle push (`PushRegistrar`).
 * `null` = niente da aprire (es. turno annullato: la RLS lo nasconde già al
 * cameriere; rimozione dallo staff: non c'è più una risorsa da mostrare).
 */
export function routeForNotification(
  role: Role,
  type: NotificationType,
  relatedId: string | null
): Href | null {
  if (role === "waiter") {
    if (type === "staff_invite") return "/(waiter)/inviti";
    // Per i messaggi related_id è la conversazione, non un turno.
    if (type === "new_message") {
      return relatedId ? `/(waiter)/chat/${relatedId}` : null;
    }
    if (type === "shift_cancelled" || type === "staff_removed") return null;
    return relatedId ? `/(waiter)/shift/${relatedId}` : null;
  }

  // manager
  if (type === "staff_response") return "/(manager)/(tabs)/staff";
  if (type === "new_message") {
    return relatedId ? `/(manager)/chat/${relatedId}` : null;
  }
  return relatedId ? `/(manager)/shift/${relatedId}` : null;
}
