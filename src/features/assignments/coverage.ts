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
