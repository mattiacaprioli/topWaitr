/**
 * Ruoli canonici dell'organico. Usati sia per la scheda staff (che scrive
 * `staff_members.role`) sia per il fabbisogno per ruolo dei turni interni:
 * devono combaciare esattamente perché la copertura faccia il match.
 *
 * ⚠️ SI AGGIUNGE IN CODA, NON SI RINOMINA E NON SI RIORDINA. Il match fra
 * `staff_members.role` e `shift_role_requirements.role` è per stringa esatta:
 * rinominare un ruolo scollegherebbe la copertura di tutti i turni già creati
 * e delle schede staff già compilate, senza alcun errore visibile.
 *
 * La lista copre ristoranti ma anche hotel, catering, discoteche, pub e agenzie
 * di eventi: è il settore degli "extra" a chiamata a cui l'app si rivolge.
 */
export const STAFF_ROLES = [
  // Sala
  "Cameriere",
  "Chef de Rang",
  "Sommelier",
  "Runner",
  "Hostess",
  "Barman",
  // Cucina
  "Cuoco",
  "Aiuto cuoco",
  "Lavapiatti",
  // Accoglienza ed eventi
  "Receptionist",
  "Guardarobiere",
  "Facchino",
  "Allestitore",
  "Steward",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
