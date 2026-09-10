/**
 * Opzioni del turno marketplace ("Cerco un extra"), condivise tra il form
 * dell'app (`ExtraShiftForm`) e quello della dashboard web. Prima vivevano come
 * costanti locali in `ExtraShiftForm.tsx`: due liste diverse sui due schermi
 * produrrebbero turni incoerenti sullo stesso feed.
 *
 * Nota: è una lista più corta di `STAFF_ROLES` (l'organico interno), di
 * proposito — qui si cerca una figura sul mercato, non si cataloga il personale.
 */
export const EXTRA_SHIFT_ROLES = [
  "Cameriere",
  "Chef de rang",
  "Sommelier",
  "Runner",
  "Barista",
  "Hostess",
  "Lavapiatti",
] as const;

/** Requisiti rapidi, salvati in `shifts.requirements` (array di testo). */
export const EXTRA_SHIFT_BADGES = [
  "Veloce",
  "Cortese",
  "Vino",
  "Cocktail",
  "Multi",
  "Gentile",
  "Eventi",
] as const;

export const RATE_MIN = 8;
export const RATE_MAX = 30;
