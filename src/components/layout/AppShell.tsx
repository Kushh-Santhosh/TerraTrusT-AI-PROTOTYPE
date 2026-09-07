import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Map,
  FileBadge,
  Sparkles,
  Users2,
  Briefcase,
  Building2,
  BarChart3,
  ShieldCheck,
  Bell,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  MessageSquare,
  FileText,
  Gavel,
  ShieldAlert,
  Banknote,
  LifeBuoy,
  Brain,
  ScanLine,
  Activity,
  Leaf,
  Compass,
  Satellite,
  ListChecks,
  Lightbulb,
  PlusCircle,
  FolderLock,
  Shield,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { notifications } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth, roleLabels, normalizeRole, type Role } from "@/lib/auth";

export interface NavItem {
  to: string;
  label: string;
  icon: any;
  params?: Record<string, string>;
  badge?: string | number;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const citizenNav: NavGroup[] = [
  {
    group: "Property Portfolio",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/properties", label: "My Properties", icon: FileBadge },
      { to: "/properties/new", label: "Add Property", icon: PlusCircle },
      { to: "/map", label: "GIS Cadastral Map", icon: Map },
      { to: "/ai-passport", label: "Digital Passport", icon: FileBadge },
    ],
  },
  {
    group: "AI Intelligence Suite",
    items: [
      { to: "/ai", label: "AI Intelligence Hub", icon: Brain },
      { to: "/valuation", label: "AI Valuation", icon: Sparkles },
      { to: "/ai-ocr", label: "Document OCR", icon: ScanLine },
      { to: "/ai-boundary", label: "Boundary Detection", icon: Compass },
      { to: "/ai-satellite", label: "Satellite Compare", icon: Satellite },
      { to: "/ai-land-health", label: "Land Health", icon: Leaf },
      { to: "/ai-risk", label: "Risk Analysis", icon: Activity },
      { to: "/assistant", label: "AI Assistant", icon: MessageSquare },
    ],
  },
  {
    group: "Verification & Trust",
    items: [
      { to: "/verification", label: "Verification Status", icon: ShieldCheck },
      { to: "/reports", label: "Reports & Certificates", icon: FileBadge },
      { to: "/disputes", label: "Disputes & Claims", icon: Gavel },
    ],
  },
  {
    group: "Account & Support",
    items: [
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/profile", label: "Profile", icon: User },
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/support", label: "Support / Help", icon: LifeBuoy },
    ],
  },
];

export const governmentNav: NavGroup[] = [
  {
    group: "Government Operations",
    items: [
      { to: "/government", label: "Government Dashboard", icon: Building2 },
      { to: "/verification", label: "Review Queue & Verification", icon: ListChecks },
      { to: "/surveyor/assignments", label: "Surveyor Assignments", icon: Briefcase },
      { to: "/government/parcels", label: "Registry Parcels", icon: FileBadge },
      { to: "/government/permits", label: "Permits & Conversions", icon: FileText },
      { to: "/government/disputes", label: "Decisions & Disputes", icon: Gavel },
      { to: "/government/audit", label: "Statutory Audit", icon: ShieldCheck },
    ],
  },
  {
    group: "Land Intelligence",
    items: [
      { to: "/map", label: "GIS / Parcels Map", icon: Map },
      { to: "/search", label: "Property Search", icon: Search },
      { to: "/fraud", label: "Registry Evidence & Fraud", icon: ShieldAlert },
      { to: "/ai-ocr", label: "Documents & Evidence", icon: ScanLine },
      { to: "/ai-boundary", label: "Boundary Review", icon: Compass },
    ],
  },
  {
    group: "Reporting & Governance",
    items: [
      { to: "/reports", label: "Official Reports", icon: FileBadge },
      { to: "/analytics", label: "Jurisdiction Analytics", icon: BarChart3 },
    ],
  },
  {
    group: "Account & Support",
    items: [
      { to: "/profile", label: "Government Profile", icon: User },
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/support", label: "Support Desk", icon: LifeBuoy },
    ],
  },
];

export const surveyorNav: NavGroup[] = [
  {
    group: "Field Operations",
    items: [
      { to: "/surveyor", label: "Surveyor Dashboard", icon: LayoutDashboard },
      { to: "/surveyor/assignments", label: "My Assignments", icon: Briefcase },
      { to: "/surveyor/tools", label: "Field Tools", icon: Compass },
      { to: "/ai-boundary", label: "Boundary Capture", icon: Map },
    ],
  },
  {
    group: "Property Verification",
    items: [
      { to: "/surveyor/assignments", label: "Assigned Properties", icon: FileBadge },
      { to: "/map", label: "GIS / Boundary Inspection", icon: Map },
      { to: "/ai-satellite", label: "Satellite Compare", icon: Satellite },
      { to: "/surveyor/documents", label: "Document Review", icon: ScanLine },
      { to: "/verification", label: "Verification / Evidence", icon: ShieldCheck },
    ],
  },
  {
    group: "Reporting & History",
    items: [
      { to: "/reports", label: "Survey Reports", icon: FileBadge },
      { to: "/surveyor/assignments", label: "Verification History", icon: ListChecks },
      { to: "/surveyor/cases", label: "Cases / Issues", icon: ShieldAlert },
    ],
  },
  {
    group: "Account & Support",
    items: [
      { to: "/profile", label: "Surveyor Profile", icon: User },
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/support", label: "Support Desk", icon: LifeBuoy },
    ],
  },
];

export const bankNav: NavGroup[] = [
  {
    group: "Bank Workspace",
    items: [
      { to: "/bank", label: "Bank Dashboard", icon: Banknote },
      { to: "/search", label: "Property Search", icon: Search },
      { to: "/properties", label: "Eligible Properties", icon: FileBadge },
      { to: "/verification", label: "Verification Results", icon: ShieldCheck },
      { to: "/ai-risk", label: "Collateral Review", icon: Activity },
    ],
  },
  {
    group: "Underwriting & Loans",
    items: [
      { to: "/bank/loans", label: "Active Loan Cases", icon: Banknote },
      { to: "/valuation", label: "AI Valuation Engine", icon: Sparkles },
      { to: "/ai-confidence", label: "Trust / Confidence", icon: ShieldCheck },
      { to: "/ai-passport", label: "Property Passport", icon: FileBadge },
    ],
  },
  {
    group: "Reporting & Portfolio",
    items: [
      { to: "/analytics", label: "Portfolio Analytics", icon: BarChart3 },
      { to: "/reports", label: "Audit Reports", icon: FileBadge },
    ],
  },
  {
    group: "Account & Support",
    items: [
      { to: "/profile", label: "Banker Profile", icon: User },
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/support", label: "Support Desk", icon: LifeBuoy },
    ],
  },
];

export const adminNav: NavGroup[] = [
  {
    group: "Platform Administration",
    items: [
      { to: "/admin", label: "Admin Dashboard", icon: ShieldCheck },
      { to: "/admin/users", label: "User Management", icon: User },
      { to: "/admin/roles", label: "RBAC & Permissions", icon: Shield },
      { to: "/admin/regions", label: "Jurisdictions & Regions", icon: Building2 },
      { to: "/admin/system", label: "System Settings & Health", icon: Activity },
      { to: "/integrations", label: "n8n & External Services", icon: Sparkles },
      { to: "/admin/api-keys", label: "API Credentials", icon: FolderLock },
    ],
  },
  {
    group: "Operations & Audit",
    items: [
      { to: "/admin/audit", label: "System Audit Logs", icon: ListChecks },
      { to: "/admin/feedback", label: "User Feedback", icon: MessageSquare },
      { to: "/support", label: "Support Desk", icon: LifeBuoy },
    ],
  },
  {
    group: "Analytics & Security",
    items: [
      { to: "/analytics", label: "Platform Analytics", icon: BarChart3 },
      { to: "/security", label: "Security Center", icon: ShieldAlert },
    ],
  },
  {
    group: "Account",
    items: [
      { to: "/profile", label: "Admin Profile", icon: User },
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function getWorkspaceForRole(role: Role): string {
  switch (role) {
    case "government":
      return "/government";
    case "surveyor":
      return "/surveyor";
    case "bank":
      return "/bank";
    case "admin":
      return "/admin";
    case "citizen":
    default:
      return "/dashboard";
  }
}

export function getNavForRole(role: Role): NavGroup[] {
  switch (role) {
    case "government":
      return governmentNav;
    case "surveyor":
      return surveyorNav;
    case "bank":
      return bankNav;
    case "admin":
      return adminNav;
    case "citizen":
    default:
      return citizenNav;
  }
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: string }> = {
    verified: { label: "Verified", tone: "bg-success/15 text-success ring-success/30" },
    pending: { label: "Pending", tone: "bg-warning/15 text-warning-foreground ring-warning/30" },
    disputed: { label: "Disputed", tone: "bg-destructive/15 text-destructive ring-destructive/30" },
    review: { label: "In Review", tone: "bg-primary/15 text-primary ring-primary/30" },
    draft: { label: "Draft", tone: "bg-muted text-muted-foreground ring-border" },
  };
  const s = map[status] || { label: status, tone: "bg-muted text-muted-foreground ring-border" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 capitalize",
        s.tone,
      )}
    >
      {s.label}
    </span>
  );
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const unread = notifications.filter((n) => !n.read).length;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const getEffectiveRole = (): Role => {
    const authRole = profile?.role || user?.user_metadata?.role;
    if (authRole) {
      return normalizeRole(authRole);
    }
    return "citizen";
  };

  const currentRole: Role = getEffectiveRole();
  const profileReady = !user || (!loading && profile?.id === user.id);
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email
      ? user.email.split("@")[0]
      : currentRole === "admin"
        ? "System Administrator"
        : currentRole === "surveyor"
          ? "Arjun Mehta"
          : currentRole === "government"
            ? "Dr. Vandana Rao"
            : currentRole === "bank"
              ? "Sunita Sharma"
              : "Kushal Santhosh");
  const roleLabel = roleLabels[currentRole] || "Citizen";

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || "TT";
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const isAuthorized = () => {
    if (!requiredRole) return true;
    if (!user || !profile) return false;
    const allowed = Array.isArray(requiredRole)
      ? requiredRole.map(normalizeRole)
      : [normalizeRole(requiredRole)];
    return allowed.includes(currentRole);
  };

  if (!profileReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <p className="text-sm text-muted-foreground">Loading your authorized workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col md:grid md:grid-cols-[280px_1fr] bg-background">
      {/* Left Sidebar */}
      <aside className="hidden md:flex sticky top-0 h-screen border-r border-border bg-surface-elevated flex-col justify-between">
        <div className="flex flex-col h-[calc(100vh-4.5rem)]">
          <div className="flex h-16 items-center justify-between px-5 border-b border-border/40 shrink-0">
            <Link to={getWorkspaceForRole(currentRole)}>
              <Logo />
            </Link>
            <div className="rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              <span>{roleLabel}</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" suppressHydrationWarning>
            {getNavForRole(currentRole).map((group) => (
              <div key={group.group}>
                <p
                  className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80"
                  suppressHydrationWarning
                >
                  {group.group}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const active =
                      pathname === item.to ||
                      (item.to !== "/" &&
                        item.to !== "/dashboard" &&
                        item.to !== "/admin" &&
                        item.to !== "/government" &&
                        item.to !== "/surveyor" &&
                        item.to !== "/bank" &&
                        item.to !== "/properties" &&
                        item.to !== "/disputes" &&
                        item.to !== "/reports" &&
                        item.to !== "/support" &&
                        pathname.startsWith(item.to + "/"));
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition",
                          active
                            ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/25 shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                        {item.to === "/notifications" && unread > 0 && (
                          <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            {unread}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User profile & Sign out footer */}
        <div className="border-t border-border p-3 shrink-0 bg-surface">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 md:px-8 backdrop-blur-xl">
          <div className="flex items-center md:hidden mr-1 gap-2">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to={getWorkspaceForRole(currentRole)}>
              <Logo />
            </Link>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9 text-xs"
              placeholder="Search parcels, passport IDs, surveys…"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/notifications"
              className="relative rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
              )}
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1 pr-3">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p
                  className="text-xs font-medium leading-tight text-foreground truncate max-w-[140px]"
                  suppressHydrationWarning
                >
                  {displayName}
                </p>
                <p
                  className="text-[10px] capitalize text-muted-foreground"
                  suppressHydrationWarning
                >
                  {roleLabel}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Title & Actions Banner */}
        <div className="border-b border-border bg-background px-4 md:px-8 py-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-xs md:text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        </div>

        {/* Content Area */}
        <main className="min-w-0 flex-1 px-4 md:px-8 py-6 md:py-8">
          {!isAuthorized() ? (
            <div className="surface-card max-w-xl p-8 text-center mx-auto my-12 border-destructive/30">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive mb-4">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl text-foreground">Access Restricted</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This workspace requires{" "}
                <span className="font-semibold text-foreground">
                  {Array.isArray(requiredRole) ? requiredRole.join(", ") : requiredRole}
                </span>{" "}
                role authorization. You are currently signed in as a{" "}
                <span className="font-semibold text-primary">{roleLabel}</span>.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button onClick={() => navigate({ to: getWorkspaceForRole(currentRole) as any })}>
                  Return to my workspace
                </Button>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Drawer content */}
          <aside className="relative flex w-[290px] max-w-[85vw] flex-col justify-between bg-surface-elevated border-r border-border h-full shadow-2xl z-10">
            <div className="flex flex-col h-[calc(100vh-4.5rem)]">
              <div className="flex h-16 items-center justify-between px-5 border-b border-border/40 shrink-0">
                <Link to={getWorkspaceForRole(currentRole)} onClick={() => setMobileNavOpen(false)}>
                  <Logo />
                </Link>
                <div className="flex items-center gap-2">
                  <div className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    <span>{roleLabel}</span>
                  </div>
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                {getNavForRole(currentRole).map((group) => (
                  <div key={group.group}>
                    <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                      {group.group}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const active =
                          pathname === item.to ||
                          (item.to !== "/" &&
                            item.to !== "/dashboard" &&
                            item.to !== "/admin" &&
                            item.to !== "/government" &&
                            item.to !== "/surveyor" &&
                            item.to !== "/bank" &&
                            item.to !== "/properties" &&
                            item.to !== "/disputes" &&
                            item.to !== "/reports" &&
                            item.to !== "/support" &&
                            pathname.startsWith(item.to + "/"));
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileNavOpen(false)}
                            className={cn(
                              "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition",
                              active
                                ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/25 shadow-sm"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                active
                                  ? "text-primary"
                                  : "text-muted-foreground group-hover:text-foreground",
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                            {item.to === "/notifications" && unread > 0 && (
                              <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                                {unread}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Mobile Sign Out */}
            <div className="border-t border-border p-3 shrink-0 bg-surface">
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  handleSignOut();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
