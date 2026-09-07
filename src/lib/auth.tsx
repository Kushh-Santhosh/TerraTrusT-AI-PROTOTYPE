import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

const DEMO_CREDENTIALS: Record<string, { role: Role; fullName: string; region: string }> = {
  "citizen@terratrust.ai": { role: "citizen", fullName: "Kushal Santhosh", region: "Karnataka" },
  "surveyor@terratrust.ai": { role: "surveyor", fullName: "Arjun Mehta", region: "Karnataka" },
  "government@terratrust.ai": { role: "government", fullName: "Dr. Vandana Rao", region: "Karnataka" },
  "officer@terratrust.ai": { role: "government", fullName: "Dr. Vandana Rao", region: "Karnataka" },
  "bank@terratrust.ai": { role: "bank", fullName: "Sunita Sharma", region: "Karnataka" },
  "admin@terratrust.ai": { role: "admin", fullName: "System Administrator", region: "Karnataka" },
};

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
  setDemoRole?: (role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [demoUser, setDemoUser] = useState<{ id: string; email: string; role: Role; full_name: string; region: string } | null>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("terratrust_demo_session");
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
    }
    return null;
  });

  const configError = supabaseConfigured
    ? null
    : "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.";

  const loadProfile = async (user: User | null) => {
    const rawDemo = typeof window !== "undefined" ? localStorage.getItem("terratrust_demo_session") : null;
    if (rawDemo) {
      try {
        const parsed = JSON.parse(rawDemo);
        setDemoUser(parsed);
        setProfile({
          id: parsed.id,
          email: parsed.email,
          full_name: parsed.full_name,
          role: parsed.role,
          region: parsed.region,
        });
        return;
      } catch {}
    }
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, region")
        .eq("id", user.id)
        .maybeSingle();

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
      setProfile(null);
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
      const rawDemo = typeof window !== "undefined" ? localStorage.getItem("terratrust_demo_session") : null;
      if (rawDemo) {
        try {
          const parsed = JSON.parse(rawDemo);
          setDemoUser(parsed);
          setProfile({
            id: parsed.id,
            email: parsed.email,
            full_name: parsed.full_name,
            role: parsed.role,
            region: parsed.region,
          });
          if (mounted) setLoading(false);
          return;
        } catch {}
      }
      loadProfile(nextSession?.user ?? null).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      const rawDemo = typeof window !== "undefined" ? localStorage.getItem("terratrust_demo_session") : null;
      if (rawDemo) {
        try {
          const parsed = JSON.parse(rawDemo);
          setDemoUser(parsed);
          setProfile({
            id: parsed.id,
            email: parsed.email,
            full_name: parsed.full_name,
            role: parsed.role,
            region: parsed.region,
          });
          if (mounted) setLoading(false);
          return;
        } catch {}
      } else if (data.session?.user) {
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
  }, [demoUser]);

  const activeUser: User | null = demoUser ? ({
    id: demoUser.id,
    email: demoUser.email,
    user_metadata: {
      role: demoUser.role,
      full_name: demoUser.full_name,
      region: demoUser.region,
    },
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as unknown as User) : (session?.user ?? null);

  const activeProfile: Profile | null = demoUser ? {
    id: demoUser.id,
    email: demoUser.email,
    full_name: demoUser.full_name,
    role: demoUser.role,
    region: demoUser.region,
  } : profile;

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

      if (error) {
        // Check if user is logging into a pre-configured demo account
        const cleanEmail = email.trim().toLowerCase();
        const demo = DEMO_CREDENTIALS[cleanEmail];
        if (demo) {
          try {
            await supabase.auth.signInWithPassword({
              email: "citizen@terratrust.ai",
              password: "Terra@2026",
            });
          } catch {}

          const fakeUser = {
            id: `demo_${demo.role}_user`,
            email: cleanEmail,
            role: demo.role,
            full_name: demo.fullName,
            region: demo.region,
          };
          setDemoUser(fakeUser);
          setProfile({
            id: fakeUser.id,
            email: cleanEmail,
            full_name: demo.fullName,
            role: demo.role,
            region: demo.region,
          });
          if (typeof window !== "undefined") {
            localStorage.setItem("terratrust_demo_session", JSON.stringify(fakeUser));
          }
          return { error: null, role: demo.role };
        }
        return { error: error.message, role: null };
      }

      if (data.user) {
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
      const { error } = await supabase
        .from("profiles")
        .upsert({
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
      if (typeof window !== "undefined") {
        localStorage.removeItem("terratrust_demo_session");
      }
      setDemoUser(null);
      if (supabaseConfigured) {
        await supabase.auth.signOut({ scope: "local" });
      }
      setSession(null);
      setProfile(null);
      setIsRecoverySession(false);
      return { error: null };
    },

    setDemoRole(role: Role) {
      // Connect Supabase session in background if needed
      supabase.auth.signInWithPassword({
        email: "citizen@terratrust.ai",
        password: "Terra@2026",
      }).catch(() => {});

      const meta: Record<string, { email: string; fullName: string }> = {
        citizen: { email: "citizen@terratrust.ai", fullName: "Kushal Santhosh" },
        surveyor: { email: "surveyor@terratrust.ai", fullName: "Arjun Mehta" },
        government: { email: "government@terratrust.ai", fullName: "Dr. Vandana Rao" },
        bank: { email: "bank@terratrust.ai", fullName: "Sunita Sharma" },
        admin: { email: "admin@terratrust.ai", fullName: "System Administrator" },
      };
      const info = meta[role] || { email: `${role}@terratrust.ai`, fullName: "Demo User" };
      const sessionObj = {
        id: `demo_${role}`,
        email: info.email,
        role,
        full_name: info.fullName,
        region: "Karnataka",
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("terratrust_demo_session", JSON.stringify(sessionObj));
      }
      setDemoUser(sessionObj);
      setProfile({
        id: sessionObj.id,
        email: sessionObj.email,
        full_name: sessionObj.full_name,
        role: sessionObj.role,
        region: sessionObj.region,
      });
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
