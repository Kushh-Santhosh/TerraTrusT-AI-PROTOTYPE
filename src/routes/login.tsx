import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, roleHome } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — TerraTrust AI" }] }),
  component: LoginPage,
});

const demoAccounts = [
  { role: "Citizen", email: "citizen@terratrust.ai", pass: "Terra@2026", to: "/dashboard" as const },
  { role: "Surveyor", email: "surveyor@terratrust.ai", pass: "Survey@2026", to: "/surveyor" as const },
  { role: "Government officer", email: "government@terratrust.ai", pass: "Gov@2026", to: "/government" as const },
  { role: "Community verifier", email: "community@terratrust.ai", pass: "Community@2026", to: "/community" as const },
  { role: "Bank", email: "bank@terratrust.ai", pass: "Bank@2026", to: "/bank" as const },
  { role: "Administrator", email: "admin@terratrust.ai", pass: "Admin@2026", to: "/admin" as const },
];

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, configError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please provide both email and password.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const { error, role } = await signIn(email, password);
    setSubmitting(false);

    if (error) {
      setErrorMsg(error);
      toast.error(error);
      return;
    }

    const destination = roleHome(role || "citizen");
    toast.success("Signed in successfully");
    navigate({ to: destination });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your Property Passports and verifications."
      footer={<>Don't have an account? <Link to="/register" className="font-medium text-primary">Create one</Link></>}
    >
      {configError && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
          {configError}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <Button type="button" variant="outline" className="h-11" onClick={() => toast.info("Google OAuth will be enabled upon provider setup in Supabase.")}>
          <GoogleIcon /> Continue with Google
        </Button>
        <div className="relative my-1 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="bg-background px-2 relative z-10">or with email</span>
          <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            required
            placeholder="you@email.com"
            className="h-11"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary">Forgot?</Link>
          </div>
          <Input
            id="login-password"
            type="password"
            required
            placeholder="••••••••"
            className="h-11"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="h-11" disabled={submitting}>
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Sign in"}
        </Button>
      </form>

      <div className="mt-8 rounded-xl border border-border bg-surface/60 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Test credentials helper</p>
        <p className="mt-1 text-xs text-muted-foreground">Fill in sample account details to authenticate against your Supabase project.</p>
        <div className="mt-3 grid gap-2">
          {demoAccounts.map(a => (
            <div key={a.email} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{a.role}</p>
                <p className="truncate text-xs text-muted-foreground">{a.email}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 rounded-full text-xs"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(a.pass);
                }}
              >
                Autofill
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
