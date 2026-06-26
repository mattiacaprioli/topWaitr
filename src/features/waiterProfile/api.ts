import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;
export type WaiterProfile = Tables<"waiter_profiles">;

export type ProfileWithWaiter = Profile & {
  waiter_profile: WaiterProfile | null;
};

export type WaiterProfileInput = {
  full_name: string;
  city: string | null;
  bio: string | null;
  primary_role: string | null;
  languages: string | null;
  specializations: string | null;
  experience: string | null;
};

/** Ruolo principale selezionabile (scelta singola). */
export const PRIMARY_ROLE_OPTIONS = [
  "Cameriere",
  "Chef de Rang",
  "Sommelier",
  "Host",
  "Barista",
  "Runner",
  "Bartender",
] as const;

/** The signed-in waiter's profile joined with its waiter_profiles row (1:1). */
export async function getMyWaiterProfile(
  userId: string
): Promise<ProfileWithWaiter | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, waiter_profile:waiter_profiles(*)")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ProfileWithWaiter | null) ?? null;
}

/**
 * Persist the editable profile. Two non-transactional writes: the shared `profiles`
 * fields, then an upsert of the waiter-only `waiter_profiles` row (PK = user id).
 */
export async function saveWaiterProfile(
  userId: string,
  input: WaiterProfileInput
): Promise<void> {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      city: input.city,
      bio: input.bio,
    })
    .eq("id", userId);
  if (profileError) throw new Error(profileError.message);

  const { error: waiterError } = await supabase.from("waiter_profiles").upsert({
    id: userId,
    primary_role: input.primary_role,
    languages: input.languages,
    specializations: input.specializations,
    experience: input.experience,
  });
  if (waiterError) throw new Error(waiterError.message);
}
