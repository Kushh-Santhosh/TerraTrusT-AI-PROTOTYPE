import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";

export type Role = "citizen" | "surveyor" | "government" | "bank" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: Role;
  region: string | null;
}

export const roleLabels: Record<Role, string> = {
  citizen: "Citizen",
  surveyor: "Surveyor",
  government: "Government Officer",
  bank: "Bank Underwriter",
  admin: "Administrator",
};

export function roleHome(role: Role | string): string {
  const r = normalizeRole(role);
  switch (r) {
    case "surveyor":
      return "/surveyor";
    case "government":
      return "/government";
    case "bank":
      return "/bank";
    case "admin":
      return "/admin";
    case "citizen":
    default:
      return "/dashboard";
  }
}

export function normalizeRole(role: unknown): Role {
  if (role === "surveyor" || role === "government" || role === "bank" || role === "admin") {
    return role;
  }
  if (role === "officer") return "government";
  return "citizen";
}

export function authRedirectUrl(path: string): string {
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return `http://localhost:8080${path}`;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isRecoverySession: boolean;
  configError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role: Role | null }>;
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
    region?: string;
  }) => Promise<{ needsEmailConfirmation: boolean; error: string | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  saveProfile: (
    input: Partial<Pick<Profile, "full_name" | "region">>,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const configError = supabaseConfigured
    ? null
    : "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.";

  const profileLoadingRef = useState<{ inFlightUserId: string | null }>({
    inFlightUserId: null,
  })[0];
  const profileRequestRef = useRef(0);

  const loadProfile = async (user: User | null) => {
    if (!user) {
      profileRequestRef.current += 1;
      setProfile(null);
      profileLoadingRef.inFlightUserId = null;
      return;
    }
    if (profileLoadingRef.inFlightUserId === user.id && profile?.id === user.id) {
      return;
    }
    const requestId = ++profileRequestRef.current;
    profileLoadingRef.inFlightUserId = user.id;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, region")
        .eq("id", user.id)
        .maybeSingle();

      if (requestId !== profileRequestRef.current) return;
      if (data && !error) {
        setProfile({
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          role: normalizeRole(data.role),
          region: data.region,
        });
      } else {
        const metaRole = normalizeRole(user.user_metadata?.role);
        setProfile({
          id: user.id,
          full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
          email: user.email ?? null,
          role: metaRole,
          region: (user.user_metadata?.region as string | undefined) ?? null,
        });
      }
    } catch {
      if (requestId === profileRequestRef.current) setProfile(null);
    } finally {
      profileLoadingRef.inFlightUserId = null;
    }
  };

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") setIsRecoverySession(true);
      if (event === "SIGNED_OUT") setIsRecoverySession(false);
      setSession(nextSession);
      loadProfile(nextSession?.user ?? null).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const activeUser: User | null = session?.user ?? null;
  const activeProfile: Profile | null = profile;

  const value: AuthContextValue = {
    session,
    user: activeUser,
    profile: activeProfile,
    loading,
    isRecoverySession,
    configError,

    async signIn(email, password) {
      if (configError) return { error: configError, role: null };

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) return { error: error.message, role: null };

      if (data.user) {
        setSession(data.session);
        await loadProfile(data.user);
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        const resolvedRole = normalizeRole(profileRow?.role ?? data.user.user_metadata?.role);
        return { error: null, role: resolvedRole };
      }

      return { error: null, role: "citizen" };
    },

    async signUp({ email, password, fullName, region }) {
      if (configError) return { needsEmailConfirmation: false, error: configError };

      const enforcedRole: Role = "citizen";

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: enforcedRole,
            region: region?.trim() || null,
          },
          emailRedirectTo: authRedirectUrl("/login?confirmed=1"),
        },
      });

      if (error) {
        return { needsEmailConfirmation: false, error: error.message };
      }

      if (data.user && data.session) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          email: email.trim(),
          role: enforcedRole,
          region: region?.trim() || null,
        });
      }

      return { needsEmailConfirmation: !data.session, error: null };
    },

    async requestPasswordReset(email) {
      if (configError) return { error: configError };
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: authRedirectUrl("/login?recovery=1"),
      });
      return { error: error?.message ?? null };
    },

    async updatePassword(password) {
      if (configError) return { error: configError };
      const { error } = await supabase.auth.updateUser({ password });
      return { error: error?.message ?? null };
    },

    async saveProfile(input) {
      if (!activeUser) return { error: "You must be signed in." };
      const { error } = await supabase.from("profiles").upsert({
        id: activeUser.id,
        email: activeUser.email,
        full_name: input.full_name?.trim() ?? undefined,
        region: input.region?.trim() ?? undefined,
        updated_at: new Date().toISOString(),
      });
      if (!error) await loadProfile(activeUser);
      return { error: error?.message ?? null };
    },

    async signOut() {
      if (supabaseConfigured) {
        await supabase.auth.signOut({ scope: "local" });
      }
      setSession(null);
      setProfile(null);
      setIsRecoverySession(false);
      return { error: null };
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return value;
}
