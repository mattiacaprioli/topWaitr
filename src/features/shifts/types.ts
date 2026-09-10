import type { Tables } from "@/types/database";
import type { CoverageEmbeds } from "@/features/assignments/coverage";

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

export type ShiftWithVenue = Shift & {
  venue: Tables<"venues"> | null;
};
