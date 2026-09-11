import { shiftDurationHours } from "@/lib/format";
import { isActiveAssignment, type AssignmentStatus } from "./status";

/**
 * Carico di lavoro **programmato** per persona su un intervallo di giorni.
 *
 * ⚠️ Non è il consuntivo: qui le ore vengono dagli orari del turno, mentre le
 * ore *lavorate* stanno in `shift_assignments.worked_hours` e le aggrega
 * `getVenueHoursSummary` (pagina Ore, quella che va al commercialista). Questo
 * serve **mentre** si assegna, per accorgersi degli squilibri prima che
 * diventino un problema di busta paga.
 */

/** Orario ordinario settimanale (D.Lgs. 66/2003, art. 3). */
export const ORDINARY_WEEK_HOURS = 40;
/** Durata massima settimanale, straordinari inclusi (art. 4: media su 4 mesi). */
export const MAX_WEEK_HOURS = 48;

type LoadAssignment = {
  id: string;
  status: AssignmentStatus;
  staff_member: { id: string; display_name: string; role: string | null } | null;
};

/** Il minimo che serve al calcolo: un turno con i suoi assegnati. */
export type LoadShift = {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  shift_assignments: LoadAssignment[];
};

/** Un turno visto dal lato della persona. */
export type PersonShift = {
  shiftId: string;
  /** La riga di assegnazione: è quella che si sposta se il turno cambia mano. */
  assignmentId: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  status: AssignmentStatus;
  /** Ore che questo turno aggiunge al carico: 0 se la persona non viene. */
  hours: number;
};

export type PersonLoad = {
  staffMemberId: string;
  name: string;
  role: string | null;
  /** Turni per data (`YYYY-MM-DD`). */
  byDay: Map<string, PersonShift[]>;
  /** Ore programmate nell'intervallo. */
  hours: number;
  /** Giorni distinti con almeno un turno che la persona farà davvero. */
  daysWorked: number;
};

/**
 * Pivota i turni dell'intervallo per persona. `roster` fissa le righe, così chi
 * non lavora nel periodo compare comunque **a zero** — che è metà
 * dell'informazione: senza quelle righe non si vede chi è rimasto fermo.
 *
 * Ordinamento per ore decrescenti: questa vista esiste per far salire in cima i
 * casi estremi, non per cercare una persona (per quello c'è la vista a giorni).
 */
export function computeWeekLoad(
  shifts: LoadShift[],
  roster: { id: string; display_name: string; role: string | null }[]
): PersonLoad[] {
  const rows = new Map<string, PersonLoad>();
  const activeDays = new Map<string, Set<string>>();

  function row(member: {
    id: string;
    display_name: string;
    role: string | null;
  }): PersonLoad {
    const existing = rows.get(member.id);
    if (existing) return existing;
    const created: PersonLoad = {
      staffMemberId: member.id,
      name: member.display_name,
      role: member.role,
      byDay: new Map(),
      hours: 0,
      daysWorked: 0,
    };
    rows.set(member.id, created);
    activeDays.set(member.id, new Set());
    return created;
  }

  for (const member of roster) row(member);

  for (const shift of shifts) {
    // Un turno annullato non è carico di lavoro per nessuno.
    if (shift.status === "cancelled") continue;
    for (const assignment of shift.shift_assignments) {
      const member = assignment.staff_member;
      if (!member) continue;
      const person = row(member);
      const active = isActiveAssignment(assignment.status);
      const hours = active
        ? shiftDurationHours(shift.start_time, shift.end_time)
        : 0;

      const list = person.byDay.get(shift.date) ?? [];
      list.push({
        shiftId: shift.id,
        assignmentId: assignment.id,
        title: shift.title,
        date: shift.date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        status: assignment.status,
        hours,
      });
      person.byDay.set(shift.date, list);
      person.hours += hours;
      if (active) activeDays.get(member.id)?.add(shift.date);
    }
  }

  for (const [id, days] of activeDays) {
    const person = rows.get(id);
    if (person) person.daysWorked = days.size;
  }

  return [...rows.values()].sort(
    (a, b) => b.hours - a.hours || a.name.localeCompare(b.name, "it")
  );
}
