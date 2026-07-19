import { useSyncExternalStore } from "react";

export type PlanTier = "free" | "pro";

// Override del piano SOLO in sviluppo: permette di "sbirciare" lo stato Free
// (vedere i lucchetti) senza cambiare il piano reale sul DB. In produzione è
// sempre null → no-op, il piano viene solo dal profilo.
let override: PlanTier | null = null;
const listeners = new Set<() => void>();

export function setDevPlanOverride(value: PlanTier | null) {
  if (!__DEV__) return;
  override = value;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): PlanTier | null {
  return __DEV__ ? override : null;
}

/** Piano simulato in dev (null = nessun override → usa quello reale). */
export function useDevPlanOverride(): PlanTier | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
