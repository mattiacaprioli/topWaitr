import { supabase } from "@/lib/supabase";
import type { Enums, Tables } from "@/types/database";

export type Application = Tables<"applications">;
export type Profile = Tables<"profiles">;

export type ApplicationWithWaiter = Application & {
  waiter: Profile | null;
};

export async function getApplications(
  shiftId: string
): Promise<ApplicationWithWaiter[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*, waiter:profiles!applications_waiter_id_fkey(*)")
    .eq("shift_id", shiftId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ApplicationWithWaiter[] | null) ?? [];
}

export async function updateApplicationStatus(
  id: string,
  status: Enums<"application_status">
): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** The waiter's own application for a shift, if any (UNIQUE on shift_id+waiter_id). */
export async function getMyApplication(
  shiftId: string,
  waiterId: string
): Promise<Application | null> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("shift_id", shiftId)
    .eq("waiter_id", waiterId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function createApplication(input: {
  shift_id: string;
  waiter_id: string;
  message?: string | null;
}): Promise<Application> {
  const { data, error } = await supabase
    .from("applications")
    .insert({
      shift_id: input.shift_id,
      waiter_id: input.waiter_id,
      message: input.message?.trim() ? input.message.trim() : null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
