import { supabase } from "@/lib/supabase";

/**
 * Cancella l'account di chi è loggato.
 *
 * Passa dalla Edge Function `delete-account` e non da una RPC diretta perché
 * servono i poteri di service_role per rimuovere la riga da `auth.users`
 * (email e credenziali), cosa che il client non può fare. La function ricava
 * l'utente dal JWT, quindi non c'è alcun id da passare — e nessun modo di
 * cancellare l'account di qualcun altro.
 */
export async function deleteMyAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ deleted: boolean }>(
    "delete-account",
    { method: "POST" }
  );
  if (error) throw new Error(error.message);
  if (!data?.deleted) throw new Error("Cancellazione non riuscita");
}
