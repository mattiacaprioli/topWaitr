import { REVIEW_SITE_URL } from "@/features/reviews/config";

/**
 * Pagine legali pubbliche. Vivono nella stessa cartella statica del sito di
 * recensione (`web-review/`, su GitHub Pages), quindi condividono la base URL
 * già configurata via EXPO_PUBLIC_REVIEW_SITE_URL — che è senza slash finale.
 *
 * Gli stessi indirizzi vanno dichiarati nelle schede degli store: Play Console
 * chiede sia l'URL dell'informativa sia quello per la richiesta di
 * cancellazione account.
 */
export const LEGAL_URLS = {
  privacy: `${REVIEW_SITE_URL}/privacy.html`,
  accountDeletion: `${REVIEW_SITE_URL}/elimina-account.html`,
} as const;
