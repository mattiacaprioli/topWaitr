import { toDateString, toTimeString } from "@/lib/format";
import type { ShiftForm } from "./schema";
import type { Shift } from "./types";

/** "HH:MM[:SS]" -> Date di oggi con quell'orario (per i picker del form). */
function timeToDate(time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

/** Turno dal DB -> valori del form (precompilazione in modifica). */
export function shiftToForm(s: Shift): ShiftForm {
  return {
    title: s.title,
    date: new Date(`${s.date}T00:00:00`),
    start: timeToDate(s.start_time),
    end: timeToDate(s.end_time),
    positions: String(s.positions_total),
    rate: s.hourly_rate != null ? String(s.hourly_rate).replace(".", ",") : "",
    dressCode: s.dress_code ?? "",
    requirements: (s.requirements ?? []).join(", "),
    description: s.description ?? "",
  };
}

/** Valori del form -> campi condivisi del turno (create e update, senza venue_id). */
export function formToShiftFields(values: ShiftForm) {
  const rate = values.rate.trim()
    ? parseFloat(values.rate.replace(",", "."))
    : null;
  return {
    title: values.title,
    date: toDateString(values.date),
    start_time: toTimeString(values.start),
    end_time: toTimeString(values.end),
    positions_total: Math.max(1, parseInt(values.positions, 10) || 1),
    hourly_rate: rate,
    dress_code: values.dressCode || null,
    description: values.description || null,
    requirements: values.requirements
      ? values.requirements
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean)
      : null,
  };
}
