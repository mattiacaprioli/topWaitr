import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { cn } from "@/lib/cn";

type Toast = { id: number; text: string; tone: "info" | "error" };
type ToastApi = { show: (text: string, tone?: "info" | "error") => void };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast richiede <ToastProvider />");
  return ctx;
}

/** Avvisi effimeri in basso a destra. Equivalente web di `@/providers/Toast`. */
export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((text: string, tone: "info" | "error" = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, tone }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      5000
    );
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2 print:hidden">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg",
              t.tone === "error"
                ? "border-error/40 bg-error/15 text-error"
                : "border-border-gold bg-bg-2 text-t1"
            )}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
