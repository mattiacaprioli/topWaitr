/**
 * Ruoli canonici dell'app: **una lista sola**. La usano la scheda staff (che
 * scrive `staff_members.role`), il fabbisogno per ruolo dei turni interni e il
 * profilo del professionista (`waiter_profiles.primary_role`, esposto come
 * `PRIMARY_ROLE_OPTIONS`). Devono combaciare esattamente perché la copertura
 * faccia il match.
 *
 * Erano due elenchi diversi, e il ruolo veniva copiato dal profilo del
 * professionista all'organico: un "Bartender" non ha mai coperto un fabbisogno
 * "Barman", senza un errore. Da qui la lista unica e `canonicalRole()`.
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
  // Aggiunto con la lista unica: era solo fra le scelte del professionista.
  "Barista",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/**
 * Ruoli non più proposti, con il canonico che li sostituisce. Le vecchie
 * installazioni continuano a scriverli finché l'utente non aggiorna l'app:
 * la migrazione ripulisce il passato, questa mappa copre l'intervallo.
 */
const LEGACY_ROLE_ALIASES: Record<string, StaffRole> = {
  host: "Hostess",
  bartender: "Barman",
};

/**
 * Riporta un ruolo qualsiasi alla forma canonica: alias storici e differenze di
 * sole maiuscole ("Chef de rang" → "Chef de Rang"). Un ruolo sconosciuto torna
 * com'è — perdere il dato sarebbe peggio che non farlo combaciare.
 *
 * Va applicato ovunque un ruolo arrivi da fuori (un altro profilo, un client
 * vecchio), mai al valore appena scelto da `STAFF_ROLES`.
 */
export function canonicalRole(role: string | null | undefined): string | null {
  const trimmed = role?.trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  const alias = LEGACY_ROLE_ALIASES[key];
  if (alias) return alias;
  return STAFF_ROLES.find((r) => r.toLowerCase() === key) ?? trimmed;
}
