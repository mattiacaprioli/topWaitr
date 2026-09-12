import { supabase } from "@/lib/supabase";
import { PRIMARY_ROLE_EXAMPLES } from "@/features/waiterProfile/api";

/** Ruolo principale — testo libero, stessi esempi del profilo cameriere. */
export { PRIMARY_ROLE_EXAMPLES };

export type OnboardingInput = {
  full_name: string;
  city: string | null;
  primary_role: string;
};

/**
 * Chiude l'onboarding: aggiorna i campi condivisi di `profiles` (e alza il flag
 * `onboarding_complete`) e fa un upsert PARZIALE di `waiter_profiles` — le colonne
 * non elencate (languages, experience…) restano intatte.
 */
export async function completeOnboarding(
  userId: string,
  input: OnboardingInput
): Promise<void> {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      city: input.city,
      onboarding_complete: true,
    })
    .eq("id", userId);
  if (profileError) throw new Error(profileError.message);

  const { error: waiterError } = await supabase.from("waiter_profiles").upsert({
    id: userId,
    primary_role: input.primary_role,
  });
  if (waiterError) throw new Error(waiterError.message);
}

/**
 * Segna che l'utente ha visto l'intro di primo utilizzo (carosello di valore).
 * Distinto da `onboarding_complete` (wizard di setup profilo del cameriere).
 * La RLS "profiles: own read/write" (id = auth.uid()) consente l'update.
 */
export async function markIntroSeen(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ intro_seen: true })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}
