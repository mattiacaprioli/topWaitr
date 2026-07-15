import { supabase } from "@/lib/supabase";
import type { Enums, TablesInsert, TablesUpdate } from "@/types/database";
import type { Shift, ShiftWithCount, ShiftWithVenue } from "./types";

export type { Shift, ShiftWithCount, ShiftWithVenue };

export const SHIFTS_PAGE_SIZE = 20;

/** Turni futuri/di oggi del locale ("In programma" + KPI home). Bounded. */
export async function getMyShifts(venueId: string): Promise<ShiftWithCount[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("shifts")
    .select("*, applications(count), shift_assignments(count)")
    .eq("venue_id", venueId)
    .gte("date", today)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ShiftWithCount[] | null) ?? [];
}

/** Storico paginato: turni passati del locale, più recenti prima. */
export async function getVenuePastShiftsPage(
  venueId: string,
  page: number
): Promise<ShiftWithCount[]> {
  const today = new Date().toISOString().slice(0, 10);
  const from = page * SHIFTS_PAGE_SIZE;
  const { data, error } = await supabase
    .from("shifts")
    .select("*, applications(count), shift_assignments(count)")
    .eq("venue_id", venueId)
    .lt("date", today)
    .order("date", { ascending: false })
    .order("start_time", { ascending: false })
    .range(from, from + SHIFTS_PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  return (data as ShiftWithCount[] | null) ?? [];
}

/** Conteggio dei turni passati del locale (KPI "turni svolti"). */
export async function getVenuePastShiftsCount(venueId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { count, error } = await supabase
    .from("shifts")
    .select("*", { count: "exact", head: true })
    .eq("venue_id", venueId)
    .lt("date", today);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Open, non-past shifts across all venues — the waiter's marketplace feed. */
export async function getOpenShifts(): Promise<ShiftWithVenue[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("shifts")
    .select("*, venue:venues(*)")
    .eq("status", "open")
    .eq("kind", "marketplace")
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
