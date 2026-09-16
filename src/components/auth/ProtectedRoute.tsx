import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState, Outlet } from "@tanstack/react-router";
import { useAuth, roleHome, normalizeRole, type Role } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  allowedRoles?: Role | Role[];
  children?: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { session, user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const effectiveRole: Role = normalizeRole(
    profile?.role || user?.user_metadata?.role || "citizen",
  );
  const isAuthenticated = Boolean(session && user);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({
        to: "/login",
        search: { redirect: pathname } as never,
        replace: true,
      });
    }
  }, [loading, isAuthenticated, pathname, navigate]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;

      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          window.location.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      });
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Verifying Supabase Session…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-medium text-muted-foreground">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  if (allowedRoles) {
    const allowed = Array.isArray(allowedRoles)
      ? allowedRoles.map(normalizeRole)
      : [normalizeRole(allowedRoles)];

    if (!allowed.includes(effectiveRole)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="surface-card max-w-md p-8 text-center border-destructive/30">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive mb-4">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl text-foreground">Access Restricted</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This area requires{" "}
              <span className="font-semibold text-foreground">
                {Array.isArray(allowedRoles) ? allowedRoles.join(", ") : allowedRoles}
              </span>{" "}
              authorization. You are currently authenticated as{" "}
              <span className="font-semibold text-primary capitalize">{effectiveRole}</span>.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={() => navigate({ to: roleHome(effectiveRole) as never, replace: true })}
              >
                Return to Authorized Workspace
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
