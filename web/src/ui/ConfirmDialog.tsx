import { useEffect } from "react";
import { Button } from "./primitives";

type Props = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Bottone di conferma rosso, per le azioni che si rimpiangono. */
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Conferma in stile app (equivalente web di `@/components/ui/ConfirmModal`):
 * il `window.confirm` del browser è l'unica cosa in tutta la dashboard che non
 * assomiglia alla dashboard, e per un'azione distruttiva è proprio il momento
 * in cui serve che l'utente riconosca dove si trova.
 *
 * Si monta solo quando serve: chi lo usa tiene un pezzo di stato e lo rende
 * condizionalmente, come `DuplicateWeekDialog`.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  destructive,
  pending,
  onConfirm,
  onCancel,
}: Props) {
  // Esc chiude, come ci si aspetta da un dialogo: mentre l'azione è in corso
  // no, altrimenti si chiude la finestra su una mutation già partita.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={pending ? undefined : onCancel}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-label={title}
        aria-modal
        className="relative w-full max-w-sm rounded-2xl border border-border-2 bg-bg-card p-6"
      >
        <h2 className="font-serif text-lg text-t1">{title}</h2>
        {message ? (
          <p className="mt-2 text-sm leading-5 text-t2">{message}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant={destructive ? "danger" : "gold"}
            onClick={onConfirm}
            disabled={pending}
            autoFocus
          >
            {pending ? "Attendere…" : confirmLabel}
          </Button>
          <Button onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
