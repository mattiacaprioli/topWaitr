import { supabase } from "@/lib/supabase";
import type { Enums, Tables } from "@/types/database";
import type { Shift, ShiftWithVenue } from "@/features/shifts/types";
import type { StaffMember } from "@/features/staff/api";
import { assignmentHours, isWorked } from "./hours";

export type Assignment = Tables<"shift_assignments">;

/** Waiter side: an assignment joined with its shift + venue. */
export type AssignmentWithShift = Assignment & {
  shift: ShiftWithVenue | null;
};

type WaiterMini = Pick<Tables<"profiles">, "id" | "full_name" | "avatar_url">;

/** Assignment + the staff member (and their linked waiter, if any). */
export type AssignmentWithStaff = Assignment & {
  staff_member: (StaffMember & { waiter: WaiterMini | null }) | null;
};

/** Today's internal-shift assignment, with staff + rating + shift slot (home). */
export type TodayAssignmentRow = Assignment & {
  staff_member:
    | (StaffMember & {
        waiter:
          | (WaiterMini & {
              waiter_profile: {
                rating_avg: number;
                rating_count: number;
              } | null;
            })
          | null;
      })
    | null;
  shift: Pick<
    Shift,
    "id" | "title" | "date" | "start_time" | "end_time" | "venue_id"
  > | null;
};

/**
 * Create an "internal" shift (mode "Chiamo il mio staff") and assign it to the
 * given roster members in one go. Internal shifts don't enter the marketplace
 * feed; positions are pre-filled by the assignees.
 */
export async function createInternalShift(input: {
  venue_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string | null;
  staffIds: string[];
  /** Fabbisogno per ruolo (es. 2 Cameriere + 1 Sommelier). */
  roleTargets?: { role: string; count: number }[];
}): Promise<Shift> {
  const { staffIds, roleTargets, ...fields } = input;
  const targets = (roleTargets ?? []).filter((t) => t.count > 0);
  const targetSum = targets.reduce((s, t) => s + t.count, 0);
  const { data: shift, error } = await supabase
    .from("shifts")
    .insert({
      ...fields,
      kind: "internal",
      status: "open",
      positions_total: Math.max(1, targetSum, staffIds.length),
      positions_filled: staffIds.length,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  if (targets.length > 0) {
    const { error: rErr } = await supabase
      .from("shift_role_requirements")
      .insert(
        targets.map((t) => ({ shift_id: shift.id, role: t.role, count: t.count }))
      );
    if (rErr) throw new Error(rErr.message);
  }

  if (staffIds.length > 0) {
    const rows = staffIds.map((id) => ({
      shift_id: shift.id,
      staff_member_id: id,
    }));
    const { error: aErr } = await supabase
      .from("shift_assignments")
      .insert(rows);
    if (aErr) throw new Error(aErr.message);
  }
  return shift;
}

export type ShiftRoleRequirement = Tables<"shift_role_requirements">;

/** Fabbisogno per ruolo di un turno. */
export async function getShiftRoleRequirements(
  shiftId: string
): Promise<ShiftRoleRequirement[]> {
  const { data, error } = await supabase
    .from("shift_role_requirements")
    .select("*")
    .eq("shift_id", shiftId)
    .order("role", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ShiftRoleRequirement[] | null) ?? [];
}

/** Turno interno con fabbisogno + assegnati (con ruolo) per il calcolo copertura. */
export type CoverageShift = {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  positions_total: number;
  positions_filled: number;
  shift_role_requirements: { role: string; count: number }[];
  shift_assignments: {
    status: Enums<"assignment_status">;
    staff_member: { role: string | null } | null;
  }[];
};

/** Turni interni futuri del locale con dati per calcolare la copertura per ruolo. */
export async function getVenueCoverage(venueId: string): Promise<CoverageShift[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("shifts")
    .select(
      "id, title, date, start_time, end_time, positions_total, positions_filled, shift_role_requirements(role, count), shift_assignments(status, staff_member:staff_members(role))"
    )
    .eq("venue_id", venueId)
    .eq("kind", "internal")
    // Gli annullati non hanno fabbisogno da coprire.
    .neq("status", "cancelled")
    .gte("date", today)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as CoverageShift[] | null) ?? [];
}

export async function getShiftAssignments(
  shiftId: string
): Promise<AssignmentWithStaff[]> {
  const { data, error } = await supabase
    .from("shift_assignments")
    .select(
      "*, staff_member:staff_members(*, waiter:profiles!staff_members_waiter_id_fkey(id, full_name, avatar_url))"
    )
    .eq("shift_id", shiftId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as AssignmentWithStaff[] | null) ?? [];
}

export async function updateAssignmentStatus(
  id: string,
  status: Enums<"assignment_status">
): Promise<void> {
  const { error } = await supabase
    .from("shift_assignments")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Presenza a turno concluso: stato (presente/assente) e/o ore effettive. */
export async function setAssignmentPresence(
  id: string,
  fields: { status?: Enums<"assignment_status">; worked_hours?: number | null }
): Promise<void> {
  const { error } = await supabase
    .from("shift_assignments")
    .update(fields)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

type ShiftSlot = Pick<
  Shift,
  "id" | "title" | "date" | "start_time" | "end_time" | "venue_id"
>;

/** Manager side: an assignment joined with a lightweight shift slot. */
export type StaffAssignment = Assignment & { shift: ShiftSlot | null };

/** All assignments of one roster member (for the hours/history section). */
export async function getStaffAssignments(
  staffMemberId: string
): Promise<StaffAssignment[]> {
  const { data, error } = await supabase
    .from("shift_assignments")
    .select(
      "*, shift:shifts!inner(id, title, date, start_time, end_time, venue_id)"
    )
    .eq("staff_member_id", staffMemberId);
  if (error) throw new Error(error.message);
  const rows = (data as StaffAssignment[] | null) ?? [];
  return rows.sort((a, b) =>
    (b.shift?.date ?? "").localeCompare(a.shift?.date ?? "")
  );
}

/** Ore lavorate per membro dell'organico in un mese ("YYYY-MM"). */
export type StaffHoursRow = {
  staff_member_id: string;
  display_name: string;
  role: string | null;
  shifts_count: number;
  hours: number;
};

type HoursRawRow = {
  status: Enums<"assignment_status">;
  worked_hours: number | null;
  staff_member: { id: string; display_name: string; role: string | null } | null;
  shift: { date: string; start_time: string; end_time: string } | null;
};

function monthBounds(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  return {
    start: `${month}-01`,
    end: `${nextY}-${String(nextM).padStart(2, "0")}-01`,
  };
}

/**
 * Riepilogo ore per l'organico di un locale in un mese: aggrega i turni interni
 * già svolti (data passata, non rifiutati/assenti) per membro. Ordine per ore desc.
 */
export async function getVenueHoursSummary(
  venueId: string,
  month: string
): Promise<StaffHoursRow[]> {
  const { start, end } = monthBounds(month);
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("shift_assignments")
    .select(
      "status, worked_hours, staff_member:staff_members!inner(id, display_name, role), shift:shifts!inner(date, start_time, end_time, venue_id, kind)"
    )
    .eq("shift.venue_id", venueId)
    .eq("shift.kind", "internal")
    .gte("shift.date", start)
    .lt("shift.date", end);
  if (error) throw new Error(error.message);

  const rows = (data as HoursRawRow[] | null) ?? [];
  const byMember = new Map<string, StaffHoursRow>();
  for (const r of rows) {
    const sm = r.staff_member;
    const sh = r.shift;
    if (!sm || !sh) continue;
    if (sh.date >= today) continue; // solo turni conclusi
    if (!isWorked(r.status)) continue; // esclude rifiutati/assenti
    const h = assignmentHours(r.status, r.worked_hours, sh);
    let entry = byMember.get(sm.id);
    if (!entry) {
      entry = {
        staff_member_id: sm.id,
        display_name: sm.display_name,
        role: sm.role,
        shifts_count: 0,
        hours: 0,
      };
      byMember.set(sm.id, entry);
    }
    entry.shifts_count += 1;
    entry.hours += h;
  }
  return [...byMember.values()].sort((a, b) => b.hours - a.hours);
}

/** Waiter side: the waiter's upcoming assigned shifts (their "Prossimi turni"). */
export async function getMyAssignedUpcoming(
  waiterId: string
): Promise<AssignmentWithShift[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("shift_assignments")
    .select(
      "*, staff_member:staff_members!inner(waiter_id), shift:shifts!inner(*, venue:venues(*))"
    )
    .eq("staff_member.waiter_id", waiterId)
    .neq("status", "declined");
  if (error) throw new Error(error.message);
  const rows = (data as AssignmentWithShift[] | null) ?? [];
  return rows
    .filter((r) => r.shift != null && r.shift.date >= today)
    .sort((a, b) => a.shift!.date.localeCompare(b.shift!.date));
}

/** Waiter side: le assegnazioni passate (storico turni interni svolti), recenti prima. */
export async function getMyAssignmentHistory(
  waiterId: string
): Promise<AssignmentWithShift[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("shift_assignments")
    .select(
      "*, staff_member:staff_members!inner(waiter_id), shift:shifts!inner(*, venue:venues(*))"
    )
    .eq("staff_member.waiter_id", waiterId)
    .neq("status", "declined");
  if (error) throw new Error(error.message);
  const rows = (data as AssignmentWithShift[] | null) ?? [];
  return rows
    .filter((r) => r.shift != null && r.shift.date < today)
    .sort((a, b) => b.shift!.date.localeCompare(a.shift!.date));
}

/** Waiter side: the waiter's assignment for a specific shift, if any. */
export async function getMyAssignmentForShift(
  shiftId: string,
  waiterId: string
): Promise<Assignment | null> {
  const { data, error } = await supabase
    .from("shift_assignments")
    .select("*, staff_member:staff_members!inner(waiter_id)")
    .eq("shift_id", shiftId)
    .eq("staff_member.waiter_id", waiterId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Assignment | null) ?? null;
}

/** Assignees working today on the venue's internal shifts (home dashboard). */
export async function getTodayAssignments(
  venueId: string
): Promise<TodayAssignmentRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("shift_assignments")
    .select(
      "*, staff_member:staff_members!inner(*, waiter:profiles!staff_members_waiter_id_fkey(id, full_name, avatar_url, waiter_profile:waiter_profiles(rating_avg, rating_count))), shift:shifts!inner(id, title, date, start_time, end_time, venue_id)"
    )
    .eq("shift.venue_id", venueId)
    .eq("shift.date", today)
    // I turni annullati non contano tra chi lavora oggi.
    .neq("shift.status", "cancelled")
    .neq("status", "declined");
  if (error) throw new Error(error.message);
  const rows = (data as TodayAssignmentRow[] | null) ?? [];
  return rows.sort((a, b) =>
    (a.shift?.start_time ?? "").localeCompare(b.shift?.start_time ?? "")
  );
}
