import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, roleHome } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const localTestAccounts = import.meta.env.DEV
  ? [
      [
        "Demo Citizen",
        import.meta.env.VITE_TEST_CITIZEN_EMAIL,
        import.meta.env.VITE_TEST_CITIZEN_PASSWORD,
      ],
      [
        "Demo Government",
        import.meta.env.VITE_TEST_GOVERNMENT_EMAIL,
        import.meta.env.VITE_TEST_GOVERNMENT_PASSWORD,
      ],
      [
        "Demo Surveyor",
        import.meta.env.VITE_TEST_SURVEYOR_EMAIL,
        import.meta.env.VITE_TEST_SURVEYOR_PASSWORD,
      ],
      ["Demo Bank", import.meta.env.VITE_TEST_BANK_EMAIL, import.meta.env.VITE_TEST_BANK_PASSWORD],
      ["Demo Admin", import.meta.env.VITE_TEST_ADMIN_EMAIL, import.meta.env.VITE_TEST_ADMIN_PASSWORD],
    ].filter((account): account is [string, string, string] => Boolean(account[1] && account[2]))
  : [];

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — TerraTrust AI" }] }),
  component: LoginPage,
});

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

  const handleLocalTestSignIn = async (role: string, testEmail: string, testPassword: string) => {
    setSubmitting(true);
    setErrorMsg(null);
    const result = await signIn(testEmail, testPassword);
    setSubmitting(false);
    if (result.error) {
      setErrorMsg(result.error);
      toast.error(result.error);
      return;
    }
    const destination = roleHome(result.role || "citizen");
    toast.success(`Signed in as ${role} via Supabase Auth`);
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
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() =>
            toast.info("Google OAuth will be enabled upon provider setup in Supabase.")
          }
        >
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

      {localTestAccounts.length > 0 && (
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
            {localTestAccounts.map(([role, testEmail, testPassword]) => (
              <Button
                key={role}
                id={`test-login-${role.toLowerCase().replace(/\s+/g, "-")}`}
                type="button"
                variant="outline"
                size="sm"
                className="font-medium text-xs h-8 border-primary/20 hover:border-primary hover:bg-primary/5 transition-colors"
                disabled={submitting}
                onClick={() => handleLocalTestSignIn(role, testEmail, testPassword)}
              >
                Continue as {role}
              </Button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
