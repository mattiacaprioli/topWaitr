import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { Button, Field, Input } from "../ui/primitives";

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
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gold" />
          <h1 className="font-serif text-3xl text-t1">topWaitr</h1>
          <p className="mt-2 text-sm text-t3">
            Gestione del locale — turni, copertura e ore.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-border-2 bg-bg-card p-6"
        >
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
            Usi le stesse credenziali dell'app. La registrazione di un nuovo
            locale si fa dall'app mobile.
          </p>
        </form>
      </div>
    </main>
  );
}
