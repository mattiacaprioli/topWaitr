/**
 * Ruoli canonici dell'organico. Usati sia per la scheda staff (che scrive
 * `staff_members.role`) sia per il fabbisogno per ruolo dei turni interni:
 * devono combaciare esattamente perché la copertura faccia il match.
 */
export const STAFF_ROLES = [
  "Cameriere",
  "Chef de Rang",
  "Sommelier",
  "Runner",
  "Hostess",
  "Barman",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
