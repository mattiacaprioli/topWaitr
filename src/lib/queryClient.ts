import { QueryClient } from "@tanstack/react-query";

/**
 * Shared TanStack Query client — usato sia dall'app React Native sia dalla
 * dashboard web (`web/src/main.tsx` importa questo stesso client).
 *
 * Le query si aggiornano da sole quando i dati cambiano davvero: ogni dominio
 * ha un canale realtime (`RealtimeSync`) che invalida le chiavi interessate.
 * Il refetch "a tempo" è quindi ridondante, e su un compute piccolo costa caro:
 * ogni rientro in una schermata rifaceva l'intero set di query.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Due minuti: entro questa finestra rientrare in una schermata pesca dalla
      // cache. Non è un ritardo sui dati freschi — quelli arrivano dal realtime.
      staleTime: 2 * 60_000,
      // Tenere le query in cache mezz'ora dopo l'ultimo unmount rende la
      // navigazione avanti/indietro gratuita invece di ricominciare da capo.
      gcTime: 30 * 60_000,
      retry: 1,
      refetchOnMount: true,
      refetchOnReconnect: true,
      // ⚠️ Il default di TanStack è `true`. Su React Native è inerte, ma la
      // dashboard web condivide questo client e lì il focus della tab esiste
      // eccome: senza questa riga bastava tornare sulla scheda del browser per
      // rifare tutte le query della pagina.
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * staleTime per i contatori dei badge (campanella, messaggi non letti,
 * turni scoperti). Sono numeri, non contenuti: il realtime li
 * invalida quando cambiano, quindi non serve rinfrescarli a tempo.
 */
export const BADGE_STALE_TIME = 10 * 60_000;
