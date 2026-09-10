import type { ReviewSort } from "./types";

/**
 * Opzioni dei filtri sulla lista recensioni, condivise tra l'app e la
 * dashboard web.
 *
 * ⚠️ Erano costanti locali di `WaiterReviewsList.tsx`, quindi invisibili al web:
 * duplicarle avrebbe voluto dire due elenchi di tag che divergono appena il
 * form recensione ne aggiunge uno — e un tag scritto in un posto solo filtra
 * zero risultati senza dare errore.
 */

export const REVIEW_SORTS: { id: ReviewSort; label: string }[] = [
  { id: "recent", label: "Recenti" },
  { id: "top", label: "Voto alto" },
  { id: "low", label: "Voto basso" },
];

/** `null` = nessun filtro sulle stelle. */
export const REVIEW_STAR_FILTERS = [null, 5, 4, 3, 2, 1] as const;

/** Tag di merito che il cliente può assegnare dal form recensione. */
export const REVIEW_MERIT_TAGS = [
  "GENTILE",
  "VELOCE",
  "CORTESE",
  "VINO",
  "MULTILINGUE",
  "ATTENZIONE",
];
