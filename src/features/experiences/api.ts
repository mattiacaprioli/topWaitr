import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type Experience = Tables<"waiter_experiences">;

export type ExperienceInput = {
  company_name: string;
  role: string | null;
  start_year: number | null;
  end_year: number | null; // null = OGGI / in corso
  detail: string | null;
};

/**
 * Le esperienze di un cameriere, ordinate OGGI-first (lavori in corso in cima),
 * poi per anno di inizio decrescente. Lettura pubblica (RLS): il ristoratore
 * può vederle sul profilo del candidato.
 */
export async function getExperiences(waiterId: string): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("waiter_experiences")
    .select("*")
    .eq("waiter_id", waiterId)
    .order("end_year", { ascending: false, nullsFirst: true })
    .order("start_year", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getExperienceById(
  id: string
): Promise<Experience | null> {
  const { data, error } = await supabase
    .from("waiter_experiences")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function createExperience(
  waiterId: string,
  input: ExperienceInput
): Promise<void> {
  const { error } = await supabase
    .from("waiter_experiences")
    .insert({ waiter_id: waiterId, ...input });
  if (error) throw new Error(error.message);
}

export async function updateExperience(
  id: string,
  input: ExperienceInput
): Promise<void> {
  const { error } = await supabase
    .from("waiter_experiences")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteExperience(id: string): Promise<void> {
  const { error } = await supabase
    .from("waiter_experiences")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
