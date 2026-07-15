import { useState } from "react";

/**
 * Pull-to-refresh legato SOLO al gesto dell'utente.
 *
 * Usare questo invece di `refreshing={query.isRefetching}`: su iOS lo spinner di
 * UIRefreshControl si incastra quando `isRefetching` diventa true per
 * un'invalidazione realtime in background (vedi RealtimeSync), non per un pull.
 *
 * @param refetch funzione che rifà il fetch (es. `query.refetch`, oppure
 *   `() => Promise.all([a.refetch(), b.refetch()])` per più query).
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };
  return { refreshing, onRefresh };
}
