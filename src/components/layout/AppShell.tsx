import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Map, FileBadge, Users2, Briefcase,
  Building2, ShieldCheck, Bell, User, HelpCircle, LogOut,
  Search, Gavel, Banknote, ShieldAlert,
  FolderLock, Compass, Shield, Activity,
} from "lucide-react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { notifications } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth, roleHome, roleLabels, normalizeRole } from "@/lib/auth";
import type { Role } from "@/lib/types";

interface NavItem {
  to: string;
  label: string;
  icon: any;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

function getRoleNav(role: Role): NavGroup[] {
  const norm = normalizeRole(role);

  switch (norm) {
    case "surveyor":
      return [
        {
          group: "Surveyor Workspace",
          items: [
            { to: "/surveyor", label: "Field Assignments", icon: Briefcase },
            { to: "/surveyor/tools", label: "Boundary & GIS Tools", icon: Compass },
            { to: "/map", label: "Cadastral Map", icon: Map },
          ],
        },
        {
          group: "Account",
          items: [
            { to: "/notifications", label: "Notifications", icon: Bell },
            { to: "/profile", label: "Profile", icon: User },
            { to: "/help", label: "Surveyor Guidelines", icon: HelpCircle },
          ],
        },
      ];

    case "government":
      return [
        {
          group: "Government Registry",
          items: [
            { to: "/government", label: "Verification Queue", icon: Building2 },
            { to: "/government/parcels", label: "Registry Parcels", icon: FileBadge },
            { to: "/government/disputes", label: "Land Disputes", icon: Gavel },
            { to: "/government/audit", label: "Registry Audit Log", icon: ShieldCheck },
          ],
        },
        {
          group: "Account",
          items: [
            { to: "/notifications", label: "Notifications", icon: Bell },
            { to: "/profile", label: "Profile", icon: User },
            { to: "/help", label: "Official Handbook", icon: HelpCircle },
          ],
        },
      ];

    case "community":
      return [
        {
          group: "Community Verification",
          items: [
            { to: "/community", label: "Verification Requests", icon: Users2 },
            { to: "/disputes", label: "Neighborhood Claims", icon: Gavel },
          ],
        },
        {
          group: "Account",
          items: [
            { to: "/notifications", label: "Notifications", icon: Bell },
            { to: "/profile", label: "Profile", icon: User },
            { to: "/help", label: "Attestation Guide", icon: HelpCircle },
          ],
        },
      ];

    case "bank":
      return [
        {
          group: "Institutional Lending",
          items: [
            { to: "/bank", label: "Passport Verification", icon: Banknote },
            { to: "/bank/loans", label: "Collateral Cases", icon: FolderLock },
          ],
        },
        {
          group: "Account",
          items: [
            { to: "/notifications", label: "Notifications", icon: Bell },
            { to: "/profile", label: "Profile", icon: User },
            { to: "/help", label: "Lending Policy", icon: HelpCircle },
          ],
        },
      ];

    case "admin":
      return [
        {
          group: "Platform Administration",
          items: [
            { to: "/admin", label: "System Overview", icon: Shield },
            { to: "/admin/users", label: "Users & Roles", icon: Users2 },
            { to: "/admin/audit", label: "Audit Log", icon: ShieldCheck },
            { to: "/admin/system", label: "n8n & Infrastructure", icon: Activity },
          ],
        },
        {
          group: "Account",
          items: [
            { to: "/notifications", label: "Notifications", icon: Bell },
            { to: "/profile", label: "Profile", icon: User },
          ],
        },
      ];

    case "citizen":
    default:
      return [
        {
          group: "My Land Records",
          items: [
            { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { to: "/properties", label: "My Properties", icon: FileBadge },
            { to: "/map", label: "GIS Map View", icon: Map },
          ],
        },
        {
          group: "Account",
          items: [
            { to: "/notifications", label: "Notifications", icon: Bell },
            { to: "/profile", label: "Profile", icon: User },
            { to: "/help", label: "Help & Support", icon: HelpCircle },
          ],
        },
      ];
  }
}

export function AppShell({
  children,
  title,
  subtitle,
  actions,
  requiredRole,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  requiredRole?: Role | Role[];
}) {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const unread = notifications.filter(n => !n.read).length;

  const currentRole: Role = normalizeRole(profile?.role || user?.user_metadata?.role || "citizen");
  const displayName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split("@")[0] : "Citizen User");
  const roleLabel = roleLabels[currentRole] || "Citizen";

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || "TT";
  };

  const navGroups = getRoleNav(currentRole);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  // Route protection check
  const isAuthorized = () => {
    if (!requiredRole) return true;
    const allowed = Array.isArray(requiredRole)
      ? requiredRole.map(normalizeRole)
      : [normalizeRole(requiredRole)];
    return allowed.includes(currentRole);
  };

  return (
    <div className="grid min-h-screen w-full grid-cols-[260px_1fr] bg-background">
      {/* Left Sidebar */}
      <aside className="sticky top-0 h-screen border-r border-border bg-surface-elevated flex flex-col justify-between">
        <div>
          <div className="flex h-16 items-center px-5 border-b border-border/40">
            <Link to="/"><Logo /></Link>
          </div>
          <nav className="flex flex-col gap-6 overflow-y-auto px-3 py-4 max-h-[calc(100vh-8.5rem)]">
            {navGroups.map(group => (
              <div key={group.group}>
                <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.group}</p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map(item => {
                    const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                          active ? "bg-primary/10 text-foreground font-medium ring-1 ring-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        <span className="truncate">{item.label}</span>
                        {item.to === "/notifications" && unread > 0 && (
                          <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">{unread}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer with Real Sign Out */}
        <div className="border-t border-border p-3 bg-surface/50">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-destructive transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-8 backdrop-blur-xl">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-9 text-xs" placeholder="Search parcels, passport IDs, surveys…" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/notifications" className="relative rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />}
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1 pr-3">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-xs font-medium leading-tight text-foreground truncate max-w-[140px]">{displayName}</p>
                <p className="text-[10px] capitalize text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Title & Actions Banner */}
        <div className="border-b border-border bg-background px-8 py-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-foreground">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        </div>

        {/* Protected Route Enforcement */}
        <main className="min-w-0 flex-1 px-8 py-8">
          {!isAuthorized() ? (
            <div className="surface-card max-w-xl p-8 text-center mx-auto my-12 border-destructive/30">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive mb-4">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl text-foreground">Access Restricted</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This workspace requires <span className="font-semibold text-foreground">{Array.isArray(requiredRole) ? requiredRole.join(", ") : requiredRole}</span> role authorization. You are currently signed in as a <span className="font-semibold text-primary">{roleLabel}</span>.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button onClick={() => navigate({ to: roleHome(currentRole) })}>
                  Return to my workspace
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign in with another account
                </Button>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: "verified" | "pending" | "disputed" | "draft" }) {
  const map = {
    verified: { label: "Verified", cls: "bg-success/10 text-success ring-success/20" },
    pending: { label: "Pending", cls: "bg-warning/15 text-warning-foreground ring-warning/30" },
    disputed: { label: "Disputed", cls: "bg-destructive/10 text-destructive ring-destructive/30" },
    draft: { label: "Draft", cls: "bg-muted text-muted-foreground ring-border" },
  } as const;
  return (
    <Badge variant="outline" className={cn("rounded-full ring-1", map[status].cls)}>
      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />{map[status].label}
    </Badge>
  );
}
