import { supabase } from "@/lib/supabase";
import type { Enums, Tables } from "@/types/database";
import type { Shift } from "@/features/shifts/types";
import type { StaffMember } from "@/features/staff/api";

export type Assignment = Tables<"shift_assignments">;

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
}): Promise<Shift> {
  const { staffIds, ...fields } = input;
  const { data: shift, error } = await supabase
    .from("shifts")
    .insert({
      ...fields,
      kind: "internal",
      status: "open",
      positions_total: Math.max(1, staffIds.length),
      positions_filled: staffIds.length,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

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
    .neq("status", "declined");
  if (error) throw new Error(error.message);
  const rows = (data as TodayAssignmentRow[] | null) ?? [];
  return rows.sort((a, b) =>
    (a.shift?.start_time ?? "").localeCompare(b.shift?.start_time ?? "")
  );
}
