import { supabase } from "@/lib/supabase";
import type { Enums, Tables } from "@/types/database";
import type { ShiftWithVenue } from "@/features/shifts/types";

export type Application = Tables<"applications">;
export type Profile = Tables<"profiles">;

export type ApplicationWithWaiter = Application & {
  waiter: Profile | null;
};

export type ApplicationWithShift = Application & {
  shift: ShiftWithVenue | null;
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

/** The waiter's accepted, upcoming shifts (Home "prossimi turni"). */
export async function getMyUpcomingShifts(
  waiterId: string
): Promise<ApplicationWithShift[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("applications")
    .select("*, shift:shifts(*, venue:venues(*))")
    .eq("waiter_id", waiterId)
    .eq("status", "accepted");
  if (error) throw new Error(error.message);
  const rows = (data as ApplicationWithShift[] | null) ?? [];
  // PostgREST can't order by a nested column, so filter/sort the join client-side.
  return rows
    .filter((r) => r.shift != null && r.shift.date >= today)
    .sort((a, b) => a.shift!.date.localeCompare(b.shift!.date));
}

/** All of the waiter's applications (to gate the apply CTA across the shift list). */
export async function getMyApplications(waiterId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("waiter_id", waiterId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
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
