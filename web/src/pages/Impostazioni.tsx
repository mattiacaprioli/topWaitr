import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  NOTIFICATION_CATEGORIES,
  prefsFromProfile,
  saveNotificationPrefs,
  type NotificationCategory,
  type NotificationPrefs,
} from "@/features/notifications/preferences";
import { LEGAL_URLS } from "@/features/account/legal";
import { deleteMyAccount } from "@/features/account/api";
import { cn } from "@/lib/cn";
import { Button, Card, Input, PageHeader } from "../ui/primitives";
import { useToast } from "../ui/Toast";

export function ImpostazioniPage() {
  const { session, profile, signOut } = useAuth();

  return (
    <>
      <PageHeader title="Impostazioni" subtitle={session?.user.email ?? ""} />

      <div className="flex max-w-2xl flex-col gap-8">
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-t3">
            Account
          </h2>
          <Card className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-t1">
                {profile?.full_name ?? "Senza nome"}
              </p>
              <p className="mt-0.5 truncate text-xs text-t3">
                {session?.user.email}
              </p>
            </div>
            <Button onClick={() => void signOut()}>Esci</Button>
          </Card>
          <p className="mt-2 px-1 text-xs text-t4">
            Nome e foto del profilo si modificano dall'app. Il locale si modifica
            dalla scheda Locale.
          </p>
        </section>

        <NotificationPrefsSection />

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-t3">
            Documenti
          </h2>
          <Card className="flex flex-col gap-1 p-0">
            <LegalLink href={LEGAL_URLS.privacy} label="Informativa privacy" />
            <LegalLink
              href={LEGAL_URLS.accountDeletion}
              label="Come cancellare l'account"
            />
          </Card>
        </section>

        <DeleteAccountSection />
      </div>
    </>
  );
}

function LegalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="focus-gold flex items-center justify-between px-4 py-3 text-sm text-t1 transition first:rounded-t-2xl last:rounded-b-2xl hover:bg-bg-1"
    >
      {label}
      <span aria-hidden className="text-t4">
        ↗
      </span>
    </a>
  );
}

function NotificationPrefsSection() {
  const { session, profile, refreshProfile } = useAuth();
  const toast = useToast();
  // Stato ottimistico: lo switch deve rispondere subito, il salvataggio segue.
  const [prefs, setPrefs] = useState<NotificationPrefs>(() =>
    prefsFromProfile(profile?.notification_prefs)
  );
  const [saving, setSaving] = useState(false);

  async function toggle(id: NotificationCategory, value: boolean) {
    const next = { ...prefs, [id]: value };
    setPrefs(next);
    setSaving(true);
    try {
      await saveNotificationPrefs(session!.user.id, next);
      await refreshProfile();
    } catch {
      setPrefs(prefs); // rollback
      toast.show("Preferenza non salvata. Riprova.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-t3">
        Notifiche push
      </h2>
      <Card className="p-0">
        {NOTIFICATION_CATEGORIES.map((c, i) => {
          const on = prefs[c.id] ?? true;
          return (
            <div
              key={c.id}
              className={cn(
                "flex items-center justify-between gap-4 px-4 py-3.5",
                i > 0 && "border-t border-border"
              )}
            >
              <div>
                <p className="text-sm font-semibold text-t1">{c.label}</p>
                <p className="mt-0.5 text-xs text-t3">{c.description}</p>
              </div>
              <button
                role="switch"
                aria-checked={on}
                aria-label={c.label}
                disabled={saving}
                onClick={() => void toggle(c.id, !on)}
                className={cn(
                  "focus-gold relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50",
                  on ? "bg-gold" : "bg-bg-3"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-t1 transition-all",
                    on ? "left-[1.375rem]" : "left-0.5"
                  )}
                />
              </button>
            </div>
          );
        })}
      </Card>
      <p className="mt-2 px-1 text-xs leading-5 text-t4">
        Questi interruttori controllano solo gli avvisi push <b>sul telefono</b>:
        la dashboard non ne riceve. Le notifiche restano comunque visibili sia
        qui sia nell'app.
      </p>
    </section>
  );
}

const CONFIRM_WORD = "ELIMINA";

function DeleteAccountSection() {
  const { signOut } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await deleteMyAccount();
      // La sessione è ormai orfana: si esce comunque.
      await signOut();
    } catch (e) {
      toast.show(
        e instanceof Error ? e.message : "Cancellazione non riuscita",
        "error"
      );
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-t3">
        Zona pericolosa
      </h2>
      <Card className="border-error/30">
        <p className="text-sm font-semibold text-t1">Elimina l'account</p>
        <p className="mt-1 text-xs leading-5 text-t3">
          I tuoi dati personali vengono rimossi e non potrai più accedere.
          Turni e ore già registrati restano al locale in forma anonima, perché
          servono a chi ci ha lavorato. <b>L'operazione non è reversibile.</b>
        </p>

        {!open ? (
          <Button
            variant="danger"
            className="mt-4"
            onClick={() => setOpen(true)}
          >
            Elimina l'account
          </Button>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <label className="text-xs text-t2">
              Scrivi <b className="font-mono text-error">{CONFIRM_WORD}</b> per
              confermare.
            </label>
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              autoFocus
              className="max-w-56"
            />
            <div className="flex gap-2">
              <Button
                variant="danger"
                disabled={word !== CONFIRM_WORD || busy}
                onClick={() => void confirm()}
              >
                {busy ? "Eliminazione…" : "Elimina definitivamente"}
              </Button>
              <Button
                onClick={() => {
                  setOpen(false);
                  setWord("");
                }}
              >
                Annulla
              </Button>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
