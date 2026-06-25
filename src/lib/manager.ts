import { supabase } from "@/lib/supabase";
import type { Enums, Tables, TablesInsert } from "@/types/database";

export type Venue = Tables<"venues">;
export type Shift = Tables<"shifts">;
export type Application = Tables<"applications">;
export type Profile = Tables<"profiles">;

export type ShiftWithCount = Shift & {
  applications: { count: number }[];
};

export type ApplicationWithWaiter = Application & {
  waiter: Profile | null;
};

export async function getMyVenue(ownerId: string): Promise<Venue | null> {
  const { data } = await supabase
    .from("venues")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

type VenueInput = {
  name: string;
  city: string | null;
  address: string | null;
  cuisine_type: string | null;
  description: string | null;
};

export async function saveVenue(
  ownerId: string,
  input: VenueInput,
  venueId?: string
): Promise<{ data: Venue | null; error: string | null }> {
  if (venueId) {
    const { data, error } = await supabase
      .from("venues")
      .update(input)
      .eq("id", venueId)
      .select("*")
      .single();
    return { data: data ?? null, error: error?.message ?? null };
  }
  const { data, error } = await supabase
    .from("venues")
    .insert({ ...input, owner_id: ownerId })
    .select("*")
    .single();
  return { data: data ?? null, error: error?.message ?? null };
}

export async function getMyShifts(venueId: string): Promise<ShiftWithCount[]> {
  const { data } = await supabase
    .from("shifts")
    .select("*, applications(count)")
    .eq("venue_id", venueId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  return (data as ShiftWithCount[] | null) ?? [];
}

export async function getShift(id: string): Promise<Shift | null> {
  const { data } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export async function createShift(
  input: TablesInsert<"shifts">
): Promise<{ data: Shift | null; error: string | null }> {
  const { data, error } = await supabase
    .from("shifts")
    .insert(input)
    .select("*")
    .single();
  return { data: data ?? null, error: error?.message ?? null };
}

export async function updateShiftStatus(
  id: string,
  status: Enums<"shift_status">
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("shifts")
    .update({ status })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function updateShiftPositions(
  id: string,
  positionsFilled: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("shifts")
    .update({ positions_filled: positionsFilled })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function getApplications(
  shiftId: string
): Promise<ApplicationWithWaiter[]> {
  const { data } = await supabase
    .from("applications")
    .select("*, waiter:profiles!applications_waiter_id_fkey(*)")
    .eq("shift_id", shiftId)
    .order("created_at", { ascending: true });
  return (data as ApplicationWithWaiter[] | null) ?? [];
}

export async function updateApplicationStatus(
  id: string,
  status: Enums<"application_status">
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id);
  return { error: error?.message ?? null };
}
