import { supabase } from "@/lib/supabase";
import type { Enums, TablesInsert, TablesUpdate } from "@/types/database";
import type { Shift, ShiftWithCount, ShiftWithVenue } from "./types";

export type { Shift, ShiftWithCount, ShiftWithVenue };

export async function getMyShifts(venueId: string): Promise<ShiftWithCount[]> {
  const { data, error } = await supabase
    .from("shifts")
    .select("*, applications(count)")
    .eq("venue_id", venueId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ShiftWithCount[] | null) ?? [];
}

/** Open, non-past shifts across all venues — the waiter's marketplace feed. */
export async function getOpenShifts(): Promise<ShiftWithVenue[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("shifts")
    .select("*, venue:venues(*)")
    .eq("status", "open")
    .gte("date", today)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ShiftWithVenue[] | null) ?? [];
}

export async function getShiftWithVenue(
  id: string
): Promise<ShiftWithVenue | null> {
  const { data, error } = await supabase
    .from("shifts")
    .select("*, venue:venues(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ShiftWithVenue | null) ?? null;
}

export async function getShift(id: string): Promise<Shift | null> {
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
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

/** Aggiorna i campi editabili di un turno (RLS: shifts manager crud via venue). */
export async function updateShift(
  id: string,
  fields: TablesUpdate<"shifts">
): Promise<void> {
  const { error } = await supabase.from("shifts").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
}
