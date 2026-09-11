import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button, Field, Input } from "../ui/primitives";
import { AuthPanel, AuthShell } from "../ui/AuthShell";

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // signIn traduce già l'errore Supabase in italiano (authErrorMessage).
    const { error: err } = await signIn(email.trim(), password);
    if (err) setError(err);
    setBusy(false);
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
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {error ? (
            <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
              {error}
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
