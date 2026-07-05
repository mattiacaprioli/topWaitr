// URL pubblico del sito di recensione (Componente B). Dev: localhost;
// in prod = URL deployato, impostato via EXPO_PUBLIC_REVIEW_SITE_URL.
export const REVIEW_SITE_URL =
  process.env.EXPO_PUBLIC_REVIEW_SITE_URL ?? "http://localhost:8080";

/** Link che il cliente apre (scansionando il QR) per recensire questo cameriere. */
export function reviewUrlFor(waiterId: string): string {
  return `${REVIEW_SITE_URL}/?w=${waiterId}`;
}
