import type { Enums } from "@/types/database";
import { isActiveAssignment, type AssignmentStatus } from "./status";

export type RoleRequirement = { role: string; count: number };
export type CoverageAssignment = {
  status: AssignmentStatus;
  role: string | null;
};

export type CoverageRow = { role: string; required: number; covered: number };
export type Coverage = {
  rows: CoverageRow[];
  required: number;
  covered: number;
  missing: number;
};

/**
 * Copertura per ruolo: per ogni fabbisogno conta gli assegnati attivi con quel
 * ruolo. L'eccedenza su un ruolo non copre gli altri (min con il richiesto).
 */
export function computeCoverage(
  requirements: RoleRequirement[],
  assignments: CoverageAssignment[]
): Coverage {
  const active = assignments.filter((a) => isActiveAssignment(a.status));
  const rows: CoverageRow[] = requirements.map((req) => ({
    role: req.role,
    required: req.count,
    covered: active.filter((a) => a.role === req.role).length,
  }));
  const required = rows.reduce((s, r) => s + r.required, 0);
  const covered = rows.reduce((s, r) => s + Math.min(r.covered, r.required), 0);
  return { rows, required, covered, missing: Math.max(0, required - covered) };
}

/**
 * Le due relazioni da cui si legge la copertura di un turno, così come le
 * caricano le query (`shift_role_requirements(...)` + `shift_assignments(...)`).
 */
export type CoverageEmbeds = {
  shift_role_requirements: RoleRequirement[];
  shift_assignments: {
    status: AssignmentStatus;
    staff_member: { role: string | null } | null;
  }[];
};

/**
 * Copertura di un turno già caricato con le sue relazioni: unico punto in cui
 * si passa dalle righe DB agli argomenti di `computeCoverage`, così nessuna
 * schermata può sbagliare la conversione (o inventarsi lo stato).
 */
export function shiftCoverage(shift: CoverageEmbeds): Coverage {
  return computeCoverage(
    shift.shift_role_requirements,
    shift.shift_assignments.map((a) => ({
      status: a.status,
      role: a.staff_member?.role ?? null,
    }))
  );
}

/** Turno visto dai conteggi: i posti pubblicati più le relazioni della copertura. */
export type CountableShift = CoverageEmbeds & {
  kind: Enums<"shift_kind">;
  positions_filled: number;
  positions_total: number;
};

/**
 * I due numeri "coperti/da coprire" di un turno, per **tutte** le viste che li
 * mostrano (home, planning, storico, elenchi): su un turno interno con
 * fabbisogno per ruolo vale la copertura per ruolo, altrove valgono i posti
 * (`positions_*`, tenuti dai trigger DB).
 *
 * ⚠️ Chi mostra "x/y" DEVE passare da qui. Leggere `positions_filled` da una
 * parte e la copertura dall'altra fa dire due cose diverse allo stesso turno
 * sulla stessa schermata: i posti contano teste, la copertura conta i ruoli
 * che servono davvero.
 */
export function shiftCounts(shift: CountableShift): {
  filled: number;
  total: number;
  short: boolean;
} {
  const coverage = shiftCoverage(shift);
  const byRole = shift.kind === "internal" && coverage.required > 0;
  const filled = byRole ? coverage.covered : shift.positions_filled;
  const total = byRole ? coverage.required : shift.positions_total;
  return { filled, total, short: filled < total };
}
