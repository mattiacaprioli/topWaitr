import type { Enums } from "@/types/database";

export type RoleRequirement = { role: string; count: number };
export type CoverageAssignment = {
  status: Enums<"assignment_status">;
  role: string | null;
};

export type CoverageRow = { role: string; required: number; covered: number };
export type Coverage = {
  rows: CoverageRow[];
  required: number;
  covered: number;
  missing: number;
};

/** Un'assegnazione "copre" se è attiva (assegnato/confermato, non rifiutato/assente). */
function isActive(status: Enums<"assignment_status">): boolean {
  return status === "assigned" || status === "confirmed";
}

/**
 * Copertura per ruolo: per ogni fabbisogno conta gli assegnati attivi con quel
 * ruolo. L'eccedenza su un ruolo non copre gli altri (min con il richiesto).
 */
export function computeCoverage(
  requirements: RoleRequirement[],
  assignments: CoverageAssignment[]
): Coverage {
  const active = assignments.filter((a) => isActive(a.status));
  const rows: CoverageRow[] = requirements.map((req) => ({
    role: req.role,
    required: req.count,
    covered: active.filter((a) => a.role === req.role).length,
  }));
  const required = rows.reduce((s, r) => s + r.required, 0);
  const covered = rows.reduce((s, r) => s + Math.min(r.covered, r.required), 0);
  return { rows, required, covered, missing: Math.max(0, required - covered) };
}
