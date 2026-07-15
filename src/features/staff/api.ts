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

/** A waiter found by exact email (via the DEFINER RPC). Only public fields. */
export type WaiterLookup = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
};

/** Manager: look up a waiter by exact email to invite them. */
export async function findWaiterByEmail(
  email: string
): Promise<WaiterLookup | null> {
  const { data, error } = await supabase.rpc("find_waiter_by_email", {
    p_email: email,
  });
  if (error) throw new Error(error.message);
  const row = (data as WaiterLookup[] | null)?.[0];
  return row ?? null;
}

/** Waiter: a pending staff invite joined with the venue. */
export type PendingInvite = StaffMember & {
  venue: Pick<Tables<"venues">, "id" | "name" | "city" | "logo_url"> | null;
};

/** Waiter: their pending staff invites ("Richieste di collaborazione"). */
export async function getMyPendingInvites(
  waiterId: string
): Promise<PendingInvite[]> {
  const { data, error } = await supabase
    .from("staff_members")
    .select("*, venue:venues(id, name, city, logo_url)")
    .eq("waiter_id", waiterId)
    .eq("link_status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as PendingInvite[] | null) ?? [];
}

/** Waiter: a venue they're active staff for (their "I tuoi locali"). */
export type MyEmployer = StaffMember & {
  venue: Pick<
    Tables<"venues">,
    "id" | "name" | "city" | "logo_url" | "owner_id"
  > | null;
};

/** Waiter: the venues where they are confirmed (active) staff. */
export async function getMyEmployers(waiterId: string): Promise<MyEmployer[]> {
  const { data, error } = await supabase
    .from("staff_members")
    .select("*, venue:venues(id, name, city, logo_url, owner_id)")
    .eq("waiter_id", waiterId)
    .eq("link_status", "active")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as MyEmployer[] | null) ?? [];
}

/** Waiter: accept (true) or decline (false) a staff invite (via DEFINER RPC). */
export async function respondToInvite(
  staffId: string,
  accept: boolean
): Promise<void> {
  const { error } = await supabase.rpc("respond_to_staff_invite", {
    p_staff_id: staffId,
    p_accept: accept,
  });
  if (error) throw new Error(error.message);
}

/** Waiter: resign from a venue's staff (via DEFINER RPC; notifies the owner). */
export async function leaveVenue(staffId: string): Promise<void> {
  const { error } = await supabase.rpc("leave_venue", { p_staff_id: staffId });
  if (error) throw new Error(error.message);
}
