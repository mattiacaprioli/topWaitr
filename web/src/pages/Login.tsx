import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authErrorMessage, useAuth } from "@/lib/auth";
import { Button, Field, Input, PasswordInput } from "../ui/primitives";
import { AuthPanel, AuthShell } from "../ui/AuthShell";
import { useToast } from "../ui/Toast";
import { LINK_ERRORS } from "../lib/recovery";

export function LoginPage() {
  const { signIn, resetPassword } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Un link scaduto riporta qui (vedi lib/recovery): il motivo va detto,
  // altrimenti sembra che l'email non sia mai arrivata.
  const shown = error ?? LINK_ERRORS[searchParams.get("link") ?? ""] ?? null;

  /** Al primo tentativo l'avviso del link ha esaurito il suo compito. */
  function clearLinkNotice() {
    if (searchParams.has("link")) setSearchParams({}, { replace: true });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    clearLinkNotice();
    // signIn traduce già l'errore Supabase in italiano (authErrorMessage).
    const { error: err } = await signIn(email.trim(), password);
    if (err) setError(err);
    setBusy(false);
  }

  async function onForgot() {
    if (resetting) return;
    clearLinkNotice();
    const address = email.trim();
    if (!address.includes("@")) {
      setError("Scrivi la tua email qui sopra, poi richiedi il recupero.");
      return;
    }
    setError(null);
    setResetting(true);
    // Il link deve tornare su questa dashboard (dove c'è /nuova-password), non
    // al Site URL del progetto che porta all'app. Vale la stessa allowlist
    // della conferma email: vedi il commento in Registrazione.tsx.
    const res = await resetPassword(
      address,
      `${window.location.origin}${window.location.pathname}`
    );
    setResetting(false);
    if (res.error) {
      setError(authErrorMessage(res.error));
      return;
    }
    toast.show(`Email di recupero inviata a ${address}. Controlla la posta.`);
  }

  return (
    <AuthShell
      title="topWaitr"
      subtitle="Gestione del locale — turni, copertura e ore."
    >
      <AuthPanel>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Email">
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@locale.it"
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <button
            type="button"
            onClick={() => void onForgot()}
            disabled={resetting}
            className="focus-gold -mt-1 self-end rounded text-xs text-gold hover:underline disabled:opacity-50"
          >
            {resetting ? "Invio…" : "Password dimenticata?"}
          </button>

          {shown ? (
            <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
              {shown}
            </p>
          ) : null}

          <Button type="submit" variant="gold" disabled={busy}>
            {busy ? "Accesso…" : "Accedi"}
          </Button>

          <p className="text-center text-xs leading-5 text-t4">
            Sono le stesse credenziali dell&apos;app: un account solo, da
            qualunque schermo.
          </p>
        </form>
      </AuthPanel>

      <p className="mt-5 text-center text-xs text-t3">
        Non hai ancora un account?{" "}
        <Link
          to="/registrati"
          className="focus-gold font-semibold text-gold hover:underline"
        >
          Registra il tuo locale
        </Link>
      </p>
    </AuthShell>
  );
}
