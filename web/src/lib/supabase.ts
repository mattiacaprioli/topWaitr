// Client Supabase per la dashboard web.
//
// Sostituisce `src/lib/supabase.ts` via alias Vite/tsconfig: stesso tipo
// esportato (`SupabaseClient<Database>`), ma senza SecureStore — su web il
// default di supabase-js è già localStorage. Le env arrivano dallo stesso
// .env della root (vedi `envPrefix` in vite.config.ts).

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Configurazione Supabase mancante: definisci EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY nel .env della root."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
