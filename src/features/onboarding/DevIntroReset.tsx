import { GhostButton } from "@/components/ui/GhostButton";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * Pulsante SOLO in sviluppo per rivedere l'intro di primo utilizzo: riporta
 * `intro_seen` a false e ricarica il profilo → l'overlay riappare. In produzione
 * non renderizza nulla.
 */
export function DevIntroReset() {
  const { session, refreshProfile } = useAuth();
  if (!__DEV__ || !session) return null;

  async function reset() {
    await supabase
      .from("profiles")
      .update({ intro_seen: false })
      .eq("id", session!.user.id);
    await refreshProfile();
  }

  return <GhostButton label="Rivedi intro (dev)" onPress={reset} />;
}
