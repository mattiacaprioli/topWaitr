import { supabase } from "@/lib/supabase";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type StaffMember = Tables<"staff_members">;

/** Roster row + the linked waiter's avatar/name (when waiter_id is set). */
export type StaffMemberWithWaiter = StaffMember & {
  waiter: Pick<Tables<"profiles">, "id" | "full_name" | "avatar_url"> | null;
};

/** A waiter who already worked here (accepted application) — candidate to add. */
export type WorkedWaiter = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  primary_role: string | null;
};

export async function getVenueStaff(
  venueId: string
): Promise<StaffMemberWithWaiter[]> {
  const { data, error } = await supabase
    .from("staff_members")
    .select(
      "*, waiter:profiles!staff_members_waiter_id_fkey(id, full_name, avatar_url)"
    )
    .eq("venue_id", venueId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as StaffMemberWithWaiter[] | null) ?? [];
}

/**
 * Waiters with a past accepted application at this venue — the pool to add to the
 * roster ("Da chi ha già lavorato qui"). Deduped by waiter; PostgREST can't do
 * DISTINCT here, so we collapse client-side.
 */
export async function getWorkedWithWaiters(
  venueId: string
): Promise<WorkedWaiter[]> {
  const { data, error } = await supabase
    .from("applications")
    .select(
      "waiter_id, waiter:profiles!applications_waiter_id_fkey(id, full_name, avatar_url, waiter_profile:waiter_profiles(primary_role)), shift:shifts!inner(venue_id)"
    )
    .eq("status", "accepted")
    .eq("shift.venue_id", venueId);
  if (error) throw new Error(error.message);

  const seen = new Set<string>();
  const out: WorkedWaiter[] = [];
  for (const row of (data as unknown as WorkedApplicationRow[] | null) ?? []) {
    const w = row.waiter;
    if (!w || seen.has(w.id)) continue;
    seen.add(w.id);
    out.push({
      id: w.id,
      full_name: w.full_name,
      avatar_url: w.avatar_url,
      primary_role: w.waiter_profile?.primary_role ?? null,
    });
  }
  return out;
}

type WorkedApplicationRow = {
  waiter_id: string;
  waiter: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    waiter_profile: { primary_role: string | null } | null;
  } | null;
};

export async function getStaffMember(id: string): Promise<StaffMember | null> {
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function addStaffMember(
  input: TablesInsert<"staff_members">
): Promise<StaffMember> {
  const { data, error } = await supabase
    .from("staff_members")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateStaffMember(
  id: string,
  fields: TablesUpdate<"staff_members">
): Promise<void> {
  const { error } = await supabase
    .from("staff_members")
    .update(fields)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function removeStaffMember(id: string): Promise<void> {
  const { error } = await supabase.from("staff_members").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
