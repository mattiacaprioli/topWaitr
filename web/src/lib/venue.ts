import { createContext, useContext } from "react";
import type { Tables } from "@/types/database";

export type Venue = Tables<"venues">;

/**
 * Il locale corrente. È `null` solo sulla scheda "Locale" quando non ne esiste
 * ancora uno: ogni altra pagina è dietro un gate che ne garantisce la presenza.
 */
export const VenueContext = createContext<Venue | null>(null);

/** Per le pagine dietro il gate: il locale c'è per costruzione. */
export function useVenue(): Venue {
  const venue = useContext(VenueContext);
  if (!venue) {
    throw new Error(
      "useVenue richiede un locale: usa useVenueOptional() fuori dal gate."
    );
  }
  return venue;
}

/** Per la scheda "Locale", che deve funzionare anche in creazione. */
export function useVenueOptional(): Venue | null {
  return useContext(VenueContext);
}
