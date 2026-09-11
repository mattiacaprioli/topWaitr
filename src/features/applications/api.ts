import { supabase } from "@/lib/supabase";
import {
  addDaysToDate,
  isShiftOver,
  shiftSortKey,
  todayString,
} from "@/lib/format";
import type { Enums, Tables } from "@/types/database";
import type { Shift, ShiftWithVenue } from "@/features/shifts/types";

export type Application = Tables<"applications">;
export type Profile = Tables<"profiles">;
export type WaiterProfile = Tables<"waiter_profiles">;

export type ApplicationWithWaiter = Application & {
  waiter: (Profile & { waiter_profile: WaiterProfile | null }) | null;
};

export type ApplicationWithShift = Application & {
  shift: ShiftWithVenue | null;
};

/** A waiter accepted on one of the venue's shifts happening today. */
export type TodayStaffRow = Application & {
  waiter: (Profile & { waiter_profile: WaiterProfile | null }) | null;
  shift: Pick<
    Shift,
    "id" | "title" | "date" | "start_time" | "end_time" | "venue_id"
  > | null;
};

export async function getApplications(
  shiftId: string
): Promise<ApplicationWithWaiter[]> {
  const { data, error } = await supabase
    .from("applications")
    .select(
      "*, waiter:profiles!applications_waiter_id_fkey(*, waiter_profile:waiter_profiles(*))"
    )
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

/**
 * Manager dashboard: gli extra accettati che lavorano adesso o più tardi oggi.
 * Gemello marketplace di `getTodayAssignments`: la finestra parte da ieri per
 * non perdere chi è in sala su un turno notturno.
 */
export async function getTodayStaff(venueId: string): Promise<TodayStaffRow[]> {
  const today = todayString();
  const { data, error } = await supabase
    .from("applications")
    .select(
      "*, waiter:profiles!applications_waiter_id_fkey(*, waiter_profile:waiter_profiles(*)), shift:shifts!inner(id,title,date,start_time,end_time,venue_id,status)"
    )
    .eq("status", "accepted")
    .eq("shift.venue_id", venueId)
    .gte("shift.date", addDaysToDate(today, -1))
    .lte("shift.date", today)
    // I turni annullati non contano tra chi lavora oggi.
    .neq("shift.status", "cancelled");
  if (error) throw new Error(error.message);
  const rows = (data as TodayStaffRow[] | null) ?? [];
  return rows
    .filter((r) => r.shift != null && !isShiftOver(r.shift))
    .sort((a, b) => shiftSortKey(a.shift!).localeCompare(shiftSortKey(b.shift!)));
}

/** Manager dashboard: count of pending applications across the venue's shifts. */
export async function getPendingCount(venueId: string): Promise<number> {
  const { count, error } = await supabase
    .from("applications")
    .select("id, shift:shifts!inner(venue_id)", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("shift.venue_id", venueId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** The waiter's accepted, upcoming shifts (Home "prossimi turni"). */
export async function getMyUpcomingShifts(
  waiterId: string
): Promise<ApplicationWithShift[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*, shift:shifts(*, venue:venues(*))")
    .eq("waiter_id", waiterId)
    .eq("status", "accepted");
  if (error) throw new Error(error.message);
  const rows = (data as ApplicationWithShift[] | null) ?? [];
  // PostgREST can't order by a nested column, so filter/sort the join client-side.
  // "Prossimo" = non ancora finito, non "da domani": chi sta lavorando un turno
  // notturno deve continuare a vederselo qui fino a fine servizio.
  return rows
    .filter((r) => r.shift != null && !isShiftOver(r.shift))
    .sort((a, b) => shiftSortKey(a.shift!).localeCompare(shiftSortKey(b.shift!)));
}

/** Stato della candidatura per turno: quanto basta al CTA della lista turni. */
export type MyApplicationStatus = Pick<Application, "shift_id" | "status">;

/**
 * All of the waiter's applications (to gate the apply CTA across the shift list).
 *
 * Due sole colonne: il chiamante ne costruisce una mappa `shift_id → status`,
 * il resto della riga (messaggio, date, id) non lo guarda nessuno. Niente
 * `order`: c'è un UNIQUE su (shift_id, waiter_id), quindi la mappa non ha
 * duplicati da arbitrare e l'ordinamento sarebbe solo un sort in più.
 */
export async function getMyApplications(
  waiterId: string
): Promise<MyApplicationStatus[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("shift_id, status")
    .eq("waiter_id", waiterId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Lo storico del professionista non si legge più da qui: `getMyWorkHistoryPage`
// (RPC `get_my_work_history`) unisce candidature e turni interni, a pagine.
// Questa versione scaricava ogni candidatura di sempre, con turno e locale.

/**
 * "Servizi" della home professionista: candidature accettate su turni ormai
 * passati. Era calcolato scaricando tutte le candidature di sempre, con turno e
 * locale annidati e senza limite, per poi contarne alcune in JS. Qui torna solo
 * il numero.
 */
export async function getMyServicesCount(waiterId: string): Promise<number> {
  const { count, error } = await supabase
    .from("applications")
    .select("id, shift:shifts!inner(date)", { count: "exact", head: true })
    .eq("waiter_id", waiterId)
    .eq("status", "accepted")
    // Resta sulla data, come il KPI dei turni svolti del locale: un `count`
    // esatto non è correggibile lato client. Scarto: il turno notturno di ieri
    // è contato come servizio già da mezzanotte invece che da fine turno.
    .lt("shift.date", todayString());
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export const APPLICATIONS_PAGE_SIZE = 20;

export type ApplicationsFilter = "all" | "pending" | "accepted";

/** Pagina di candidature del cameriere, filtro server-side ("Le mie candidature"). */
export async function getMyApplicationsPage(
  waiterId: string,
  filter: ApplicationsFilter,
  page: number
): Promise<ApplicationWithShift[]> {
  const from = page * APPLICATIONS_PAGE_SIZE;
  let q = supabase
    .from("applications")
    .select("*, shift:shifts(*, venue:venues(*))")
    .eq("waiter_id", waiterId);
  if (filter !== "all") q = q.eq("status", filter);
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .range(from, from + APPLICATIONS_PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  return (data as ApplicationWithShift[] | null) ?? [];
}

export type ApplicationCounts = {
  total: number;
  pending: number;
  accepted: number;
};

/**
 * Conteggi per i chip filtro (indipendenti dalla paginazione).
 *
 * Erano tre `count: 'exact'` in parallelo sulla stessa tabella e sullo stesso
 * filtro: tre passate per tre numeri. Una sola lettura della colonna `status`
 * — un valore corto per riga, coperto da `applications_waiter_status_idx` —
 * li produce tutti e tre.
 */
export async function getMyApplicationCounts(
  waiterId: string
): Promise<ApplicationCounts> {
  const { data, error } = await supabase
    .from("applications")
    .select("status")
    .eq("waiter_id", waiterId);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    accepted: rows.filter((r) => r.status === "accepted").length,
  };
}

/** Withdraw the waiter's own application (RLS: applications waiter own crud). */
export async function cancelMyApplication(id: string): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) throw new Error(error.message);
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
