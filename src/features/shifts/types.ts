import type { Tables } from "@/types/database";
import type {
  CoverageEmbeds,
  RoleRequirement,
} from "@/features/assignments/coverage";
import type { AssignmentStatus } from "@/features/assignments/status";

export type Shift = Tables<"shifts">;

export type ShiftWithCount = Shift & {
  applications: { count: number }[];
  shift_assignments: { count: number }[];
};

/**
 * Turno + le relazioni della copertura per ruolo. Serve alle viste a calendario:
 * "quanto manca" si legge dai ruoli richiesti e da chi viene davvero, non dal
 * conteggio grezzo degli assegnati (che ignora ruoli e rifiuti).
 */
export type ShiftWithCoverage = Shift & CoverageEmbeds;

/**
 * Turno con le sue relazioni **e l'identità** di chi è assegnato. Serve alle
 * viste che pivotano per persona ("chi lavora quanto questa settimana"), dove
 * il ruolo non basta: serve sapere di chi si parla.
 *
 * È un sovrainsieme di `CoverageEmbeds`, quindi `shiftCoverage()` lo accetta
 * senza conversioni.
 */
export type ShiftWithAssignees = Shift & {
  shift_role_requirements: RoleRequirement[];
  shift_assignments: {
    status: AssignmentStatus;
    staff_member: {
      id: string;
      display_name: string;
      role: string | null;
    } | null;
  }[];
};

export type ShiftWithVenue = Shift & {
  venue: Tables<"venues"> | null;
};
