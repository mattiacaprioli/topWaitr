import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database";

/** Categorie degli switch push in Impostazioni. Rispecchia `notification_category()` in DB. */
export type NotificationCategory = "messages" | "shifts" | "staff";

export const NOTIFICATION_CATEGORIES: {
  id: NotificationCategory;
  label: string;
  description: string;
}[] = [
  { id: "messages", label: "Messaggi", description: "Nuovi messaggi in chat." },
  {
    id: "shifts",
    label: "Candidature e turni",
    description: "Candidature, esiti e aggiornamenti dei turni.",
  },
  {
    id: "staff",
    label: "Staff e inviti",
    description: "Inviti e cambiamenti nel tuo staff.",
  },
];

export type NotificationPrefs = Partial<Record<NotificationCategory, boolean>>;

/** Una categoria è attiva salvo esplicito `false` (modello opt-out, come in DB). */
export function isCategoryEnabled(
  prefs: Json | null | undefined,
  id: NotificationCategory
): boolean {
  if (prefs && typeof prefs === "object" && !Array.isArray(prefs)) {
    return (prefs as Record<string, unknown>)[id] !== false;
  }
  return true;
}

/** Preferenze correnti come mappa completa (default = tutte attive). */
export function prefsFromProfile(prefs: Json | null | undefined): NotificationPrefs {
  const out: NotificationPrefs = {};
  for (const c of NOTIFICATION_CATEGORIES) out[c.id] = isCategoryEnabled(prefs, c.id);
  return out;
}

export async function saveNotificationPrefs(
  userId: string,
  prefs: NotificationPrefs
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ notification_prefs: prefs })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}
