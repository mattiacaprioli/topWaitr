import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authErrorMessage, useAuth } from "@/lib/auth";
import {
  passwordRules,
  signupSchema,
  type SignupForm,
} from "@/features/auth/schema";
import { cn } from "@/lib/cn";
import { Button, Field, Input } from "../ui/primitives";
import { AuthPanel, AuthShell } from "../ui/AuthShell";

/**
 * Registrazione dalla dashboard. Il ruolo non si sceglie: questa interfaccia
 * esiste per chi gestisce un locale, quindi l'account nasce `manager` (un
 * professionista finirebbe su NotForWaitersPage al primo accesso). Il locale
 * vero e proprio si crea dopo, dal gate di AppLayout.
 *
 * `signupSchema` e `passwordRules` arrivano dall'app: regole di validazione e
 * requisiti password restano una sola fonte, allineata a Supabase Auth.
 */
export function RegistrazionePage() {
  const { signUp } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });
  const password = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return;
    setApiError(null);
    setEmailTaken(false);
    setBusy(true);
    const res = await signUp({
      email: values.email.trim(),
      password: values.password,
      fullName: values.fullName.trim(),
      role: "manager",
      // Il link di conferma deve riportare qui, non al Site URL del progetto
      // (che porta all'app). Richiede questo URL fra i "Redirect URLs" di
      // Supabase; se manca, si torna al Site URL e la registrazione è comunque
      // valida.
      emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
    });
    setBusy(false);
    if (res.error) {
      setApiError(authErrorMessage(res.error));
      return;
    }
    if (res.alreadyRegistered) {
      setEmailTaken(true);
      return;
    }
    if (res.needsConfirmation) {
      setSentTo(values.email.trim());
      return;
    }
    // Con la conferma email disattivata la sessione è già attiva: ci pensa
    // AuthProvider, e <App /> passa da sé alla dashboard.
  });

  if (sentTo) {
    return (
      <AuthShell title="Controlla la posta">
        <AuthPanel>
          <p className="text-sm leading-6 text-t2">
            Abbiamo inviato un link di conferma a{" "}
            <span className="font-semibold text-t1">{sentTo}</span>. Aprilo per
            attivare l&apos;account, poi torna qui e accedi.
          </p>
          <Link
            to="/login"
            className="focus-gold mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-gold-ink transition hover:bg-gold-light"
          >
            Vai all&apos;accesso
          </Link>
        </AuthPanel>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Registra il tuo locale"
      subtitle="Crea l'account: il locale si compila subito dopo."
    >
      <AuthPanel>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Nome e cognome" error={errors.fullName?.message}>
            <Input
              {...register("fullName")}
              autoComplete="name"
              placeholder="Mario Rossi"
            />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="nome@locale.it"
            />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <Input
              {...register("password")}
              type="password"
              autoComplete="new-password"
            />
          </Field>

          <ul className="flex flex-col gap-1.5">
            {passwordRules.map((rule) => {
              const ok = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    ok ? "text-success" : "text-t3"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[9px] font-bold",
                      ok
                        ? "bg-success text-bg-0"
                        : "border border-border-2 text-transparent"
                    )}
                  >
                    ✓
                  </span>
                  {rule.label}
                </li>
              );
            })}
          </ul>

          {apiError ? (
            <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
              {apiError}
            </p>
          ) : null}
          {emailTaken ? (
            <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
              Esiste già un account con questa email.{" "}
              <Link to="/login" className="focus-gold font-semibold underline">
                Accedi
              </Link>{" "}
              o recupera la password dall&apos;app.
            </p>
          ) : null}

          <Button type="submit" variant="gold" disabled={busy}>
            {busy ? "Creazione…" : "Crea account"}
          </Button>

          <p className="text-center text-xs leading-5 text-t4">
            Stai creando un account da locale. Se lavori come professionista, la
            registrazione si fa dall&apos;app topWaitr sul telefono.
          </p>
        </form>
      </AuthPanel>

      <p className="mt-5 text-center text-xs text-t3">
        Hai già un account?{" "}
        <Link
          to="/login"
          className="focus-gold font-semibold text-gold hover:underline"
        >
          Accedi
        </Link>
      </p>
    </AuthShell>
  );
}
