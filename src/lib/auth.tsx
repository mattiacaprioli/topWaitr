import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import type { Enums, Tables } from "@/types/database";

type Profile = Tables<"profiles">;
type Role = Enums<"user_role">;

type SignUpParams = {
  email: string;
  password: string;
  fullName: string;
  role: Role;
};

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    params: SignUpParams
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Re-fetch the profile row after an edit, without blanking the UI. */
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve essere usato dentro <AuthProvider />");
  }
  return ctx;
}

async function ensureProfile(user: User): Promise<Profile | null> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return existing;

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    role?: string;
  };
  const role: Role = meta.role === "manager" ? "manager" : "waiter";
  const { data: created } = await supabase
    .from("profiles")
    .insert({ id: user.id, full_name: meta.full_name ?? null, role })
    .select("*")
    .single();
  return created ?? null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Resolve the profile for a restored/just-authed user, retrying a few times.
 * On a cold start the access token may still be refreshing, so the first RLS
 * read can come back empty; retrying rides that out instead of leaving the app
 * with a session but no profile (which renders no matching route → black screen).
 */
async function resolveProfile(user: User): Promise<Profile | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const profile = await ensureProfile(user);
    if (profile) return profile;
    await sleep(500);
  }
  return null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile(next: Session | null) {
      if (!active) return;
      const nextProfile = next?.user ? await resolveProfile(next.user) : null;
      if (!active) return;
      setProfile(nextProfile);
      setLoading(false);
    }

    // Initial load runs outside the auth lock, so DB reads are safe to await.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      loadProfile(data.session);
    });

    // Subsequent changes arrive inside the auth lock: setting state is fine, but
    // Supabase queries (resolveProfile) MUST be deferred out of the callback or
    // they deadlock against the same lock. INITIAL_SESSION is handled above.
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      // Drop the previous account's cached data so a new sign-in starts clean.
      if (event === "SIGNED_OUT") queryClient.clear();
      // INITIAL_SESSION → handled by getSession(); TOKEN_REFRESHED → just refresh
      // the session token, no need to re-fetch the profile or blank the UI.
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED"
      ) {
        setLoading(true);
        setTimeout(() => loadProfile(next), 0);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  }

  async function signUp({ email, password, fullName, role }: SignUpParams) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) return { error: error.message, needsConfirmation: false };
    return { error: null, needsConfirmation: !data.session };
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // Re-read the profile after the user edits it. Deliberately does NOT touch `loading`
  // (that would make RootNavigator blank the app); just swaps in the fresh row.
  async function refreshProfile() {
    if (!session?.user) return;
    setProfile(await resolveProfile(session.user));
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signIn,
        signUp,
        resetPassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "Email o password non corretti.";
  }
  if (m.includes("user already registered")) {
    return "Esiste già un account con questa email.";
  }
  if (m.includes("password should be at least")) {
    return "La password deve avere almeno 6 caratteri.";
  }
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return "Inserisci un indirizzo email valido.";
  }
  if (m.includes("email not confirmed")) {
    return "Conferma la tua email prima di accedere.";
  }
  return "Si è verificato un errore. Riprova.";
}
