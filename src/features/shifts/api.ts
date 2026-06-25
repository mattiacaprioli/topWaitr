import { supabase } from "@/lib/supabase";
import type { Enums, TablesInsert } from "@/types/database";
import type { Shift, ShiftWithCount } from "./types";

export type { Shift, ShiftWithCount };

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

export async function createShift(input: TablesInsert<"shifts">): Promise<Shift> {
  const { data, error } = await supabase
    .from("shifts")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateShiftStatus(
  id: string,
  status: Enums<"shift_status">
): Promise<void> {
  const { error } = await supabase.from("shifts").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateShiftPositions(
  id: string,
  positionsFilled: number
): Promise<void> {
  const { error } = await supabase
    .from("shifts")
    .update({ positions_filled: positionsFilled })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
