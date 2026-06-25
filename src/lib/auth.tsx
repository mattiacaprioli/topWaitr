import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
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
  signOut: () => Promise<void>;
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

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function handleSession(next: Session | null) {
      if (!active) return;
      setSession(next);
      setProfile(next?.user ? await ensureProfile(next.user) : null);
      if (active) setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => handleSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) =>
      handleSession(next)
    );

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

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signIn, signUp, signOut }}
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
