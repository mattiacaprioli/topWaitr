import { useState } from "react";
import { StyleSheet } from "react-native";
import { View } from "@/tw";
import { useAuth } from "@/lib/auth";
import { INTRO_SLIDES } from "./introContent";
import { IntroCarousel } from "./IntroCarousel";
import { markIntroSeen } from "./api";

/**
 * Overlay a schermo intero con l'intro di primo utilizzo, mostrato UNA VOLTA per
 * ruolo quando `profiles.intro_seen` è false. Montato nel root layout sopra lo
 * Stack (niente rotte → nessun impatto sul typed-routes). Il cameriere lo vede
 * dopo il wizard di setup profilo; il ristoratore al primo ingresso.
 */
export function IntroOverlay() {
  const { session, profile, refreshProfile } = useAuth();
  const [dismissing, setDismissing] = useState(false);

  if (!session || !profile || profile.intro_seen) return null;
  // Il cameriere passa prima dal wizard di setup: intro solo a setup fatto.
  if (profile.role === "waiter" && !profile.onboarding_complete) return null;

  async function done() {
    if (dismissing) return;
    setDismissing(true);
    try {
      await markIntroSeen(session!.user.id);
    } catch {
      // Best-effort: se fallisce lo rivedrà, non è bloccante.
    }
    await refreshProfile();
  }

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
      <IntroCarousel slides={INTRO_SLIDES[profile.role]} onDone={done} />
    </View>
  );
}
