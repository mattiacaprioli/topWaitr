import { File } from "expo-file-system";
import { supabase } from "@/lib/supabase";
import { PRIMARY_ROLE_OPTIONS } from "@/features/waiterProfile/api";

/** Ruolo principale — riusa la lista curata del profilo cameriere. */
export { PRIMARY_ROLE_OPTIONS };

/**
 * Skill auto-dichiarate dal cameriere (scelta multipla). Le prime quattro
 * combaciano con i tag delle recensioni, così in futuro una skill può essere
 * "confermata" quando i clienti la assegnano.
 */
export const SKILL_OPTIONS = [
  "VELOCE",
  "CORTESE",
  "GENTILE",
  "VINO",
  "COCKTAIL",
  "MULTI",
  "EVENTI",
] as const;

export type CertificationOption = {
  key: string;
  title: string;
  sub: string;
};

/** Certificazioni caricabili in onboarding (upload facoltativo). */
export const CERTIFICATION_OPTIONS: readonly CertificationOption[] = [
  {
    key: "AIS_SOMMELIER",
    title: "Attestato AIS Sommelier",
    sub: "Sblocca subito il badge VINO",
  },
  { key: "HACCP", title: "Certificato HACCP", sub: "Richiesto da molti locali" },
];

export type OnboardingInput = {
  full_name: string;
  city: string | null;
  primary_role: string;
  skills: string[];
};

/** File scelto dal document picker da caricare su Storage. */
export type CertFile = { uri: string; name: string; mimeType?: string | null };

/**
 * Chiude l'onboarding: aggiorna i campi condivisi di `profiles` (e alza il flag
 * `onboarding_complete`) e fa un upsert PARZIALE di `waiter_profiles` — le colonne
 * non elencate (languages, experience, certifications…) restano intatte.
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
    skills: input.skills,
  });
  if (waiterError) throw new Error(waiterError.message);
}

/**
 * Carica un attestato nel bucket privato `certifications` sotto la cartella
 * dell'utente ({uid}/…), poi aggiunge il path a `waiter_profiles.certifications`.
 * Ritorna il path salvato. La verifica manuale del team è un passo successivo.
 */
export async function uploadCertification(
  userId: string,
  certKey: string,
  file: CertFile
): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  const path = `${userId}/${certKey}-${Date.now()}.${ext}`;

  // Nuova API expo-file-system (SDK 56): leggi il file come ArrayBuffer.
  const contents = await new File(file.uri).arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("certifications")
    .upload(path, contents, {
      contentType: file.mimeType ?? "application/octet-stream",
      upsert: true,
    });
  if (uploadError) throw new Error(uploadError.message);

  // Append del path all'array certifications (read-modify-write sulla propria riga).
  const { data: existing, error: readError } = await supabase
    .from("waiter_profiles")
    .select("certifications")
    .eq("id", userId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  const next = [...(existing?.certifications ?? []), path];
  const { error: writeError } = await supabase
    .from("waiter_profiles")
    .upsert({ id: userId, certifications: next });
  if (writeError) throw new Error(writeError.message);

  return path;
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
