import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, roleHome, type Role } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const demoAccounts: Array<[string, Role]> = [
  ["Citizen", "citizen"],
  ["Government", "government"],
  ["Surveyor", "surveyor"],
  ["Bank", "bank"],
  ["Admin", "admin"],
];

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — TerraTrust AI" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInDemo, configError } = useAuth();
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

  const handleDemoSignIn = async (label: string, role: Role) => {
    setSubmitting(true);
    setErrorMsg(null);
    const result = await signInDemo(role);
    setSubmitting(false);
    if (result.error) {
      setErrorMsg(result.error);
      toast.error(result.error);
      return;
    }
    const destination = roleHome(result.role || "citizen");
    toast.success(`Signed in as Demo ${label} via Supabase Auth`);
    navigate({ to: destination });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your Property Passports and verifications."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-primary">
            Create one
          </Link>
        </>
      }
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
        <div className="relative my-1 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="bg-background px-2 relative z-10">or with email</span>
          <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            name="email"
            autoComplete="username"
            type="email"
            required
            placeholder="you@email.com"
            className="h-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary">
              Forgot?
            </Link>
          </div>
          <Input
            id="login-password"
            name="password"
            autoComplete="current-password"
            type="password"
            required
            placeholder="••••••••"
            className="h-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="h-11" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="mt-6 rounded-lg border border-dashed border-primary/40 bg-muted/30 p-4 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-foreground tracking-wide uppercase text-[11px]">
            Demo / Test Access
          </span>
          <span className="text-[10px] text-muted-foreground">Real Supabase Auth</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          Click any stakeholder below to perform real Supabase authentication and route to the
          corresponding workspace:
        </p>
        <div className="flex flex-wrap gap-2">
          {demoAccounts.map(([label, role]) => (
            <Button
              key={role}
              id={`test-login-demo-${role}`}
              type="button"
              variant="outline"
              size="sm"
              className="font-medium text-xs h-8 border-primary/20 hover:border-primary hover:bg-primary/5 transition-colors"
              disabled={submitting}
              onClick={() => handleDemoSignIn(label, role)}
            >
              Continue as {label}
            </Button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
