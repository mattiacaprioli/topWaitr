import { supabase } from "@/lib/supabase";
import type { Enums, TablesInsert, TablesUpdate } from "@/types/database";
import type {
  Shift,
  ShiftWithAssignees,
  ShiftWithCount,
  ShiftWithCoverage,
  ShiftWithVenue,
} from "./types";

export type {
  Shift,
  ShiftWithAssignees,
  ShiftWithCount,
  ShiftWithCoverage,
  ShiftWithVenue,
};

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

/**
 * Turni del locale in un intervallo di date arbitrario (estremi inclusi).
 * Serve alle viste a calendario, che devono poter navigare anche indietro:
 * `getMyShifts` copre solo futuri/oggi e `getVenuePastShiftsPage` è paginata.
 * `from`/`to` sono date DB (`YYYY-MM-DD`), vedi `toDateString` in lib/format.
 */
export async function getVenueShiftsRange(
  venueId: string,
  from: string,
  to: string
): Promise<ShiftWithAssignees[]> {
  const { data, error } = await supabase
    .from("shifts")
    .select(
      // Identità dell'assegnato oltre al ruolo: la stessa query alimenta la
      // copertura (per ruolo) e la vista per persona (chi lavora quanto).
      "*, shift_role_requirements(role, count), shift_assignments(status, staff_member:staff_members(id, display_name, role))"
    )
    .eq("venue_id", venueId)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ShiftWithAssignees[] | null) ?? [];
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

/**
 * Quanti turni al massimo tiene il feed marketplace. È l'unica query dell'app
 * che cresce con la piattaforma invece che con l'utente: senza tetto, il giorno
 * in cui ci sono mille locali attivi ogni professionista se li scarica tutti a
 * ogni apertura. Il tetto è il turno più vicino nel tempo, che è anche l'unico
 * che qualcuno guarda davvero.
 *
 * TODO quando il feed diventerà lungo: scroll infinito (keyset su date +
 * start_time) e/o filtro per città, sul modello di `getVenuePastShiftsPage`.
 */
export const OPEN_SHIFTS_LIMIT = 100;

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
    .order("start_time", { ascending: true })
    .limit(OPEN_SHIFTS_LIMIT);
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
