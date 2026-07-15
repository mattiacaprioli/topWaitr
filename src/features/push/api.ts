import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

// Token del device corrente, tenuto in memoria così il logout può de-registrarlo
// (serve prima di auth.signOut: dopo, la RLS "own only" blocca la delete).
let currentToken: string | null = null;

/** Registra/aggiorna il push token dell'utente (RPC upsert, gestisce il riuso device). */
export async function savePushToken(token: string): Promise<void> {
  const { error } = await supabase.rpc("register_push_token", {
    p_token: token,
    p_platform: Platform.OS,
  });
  if (error) throw new Error(error.message);
  currentToken = token;
}

/**
 * De-registra il token del device (al logout, PRIMA di auth.signOut). No-op se non
 * c'è un token noto. La RLS "own only" consente la delete della propria riga.
 */
export async function unregisterCurrentPushToken(): Promise<void> {
  if (!currentToken) return;
  const token = currentToken;
  currentToken = null;
  const { error } = await supabase
    .from("push_tokens")
    .delete()
    .eq("token", token);
  if (error) throw new Error(error.message);
}
