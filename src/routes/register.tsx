import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — TerraTrust AI" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, configError } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const { error, needsEmailConfirmation } = await signUp({
      email,
      password,
      fullName,
      region,
    });

    setSubmitting(false);

    if (error) {
      setErrorMsg(error);
      toast.error(error);
      return;
    }

    if (needsEmailConfirmation) {
      toast.success("Account created! Please check your email to confirm your account.");
      navigate({ to: "/login" });
    } else {
      toast.success("Account created successfully. Welcome to TerraTrust AI!");
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register as a property owner or citizen to manage your Property Passports."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-primary">Sign in</Link></>}
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
          onClick={() => toast.info("Google sign-in will be enabled upon provider setup.")}
        >
          Continue with Google
        </Button>

        <div className="relative my-1 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="bg-background px-2 relative z-10">or with email</span>
          <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="reg-first-name">First name *</Label>
            <Input
              id="reg-first-name"
              required
              className="h-11"
              placeholder="First name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reg-last-name">Last name</Label>
            <Input
              id="reg-last-name"
              className="h-11"
              placeholder="Last name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="reg-email">Email *</Label>
          <Input
            id="reg-email"
            type="email"
            required
            className="h-11"
            placeholder="you@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="reg-password">Password (min 6 characters) *</Label>
          <Input
            id="reg-password"
            type="password"
            required
            minLength={6}
            className="h-11"
            placeholder="Create password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="reg-region">State / Region</Label>
          <Input
            id="reg-region"
            className="h-11"
            placeholder="e.g. Karnataka, India"
            value={region}
            onChange={e => setRegion(e.target.value)}
          />
        </div>

        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Note:</span> Public accounts are registered with the <span className="font-semibold text-primary">Citizen</span> role. Surveyor, Government, Bank, and Admin privileges require institutional credentialing.
        </div>

        <Button type="submit" className="h-11" disabled={submitting}>
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : "Create citizen account"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>
    </AuthLayout>
  );
}
