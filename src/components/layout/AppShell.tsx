import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Map, FileBadge, Sparkles, Users2, Briefcase,
  Building2, BarChart3, ShieldCheck, Bell, User, Settings, HelpCircle, LogOut,
  Search, MessageSquare, FileText, Gavel, ShieldAlert, Banknote, LifeBuoy,
  Brain, ScanLine, Activity, Leaf, Compass, Satellite, ListChecks, Lightbulb,
  PlusCircle, FolderLock, Shield, CheckCircle2, ChevronDown
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

export function getNavForRole(role: Role): NavGroup[] {
  // CITIZEN WORKSPACE: Strictly Citizen-facing, preserving all working AI, property, verification, and account features.
  // Must NOT expose Government, Surveyor, Bank, Admin, Community portals or cross-role switching.
  if (role === "citizen") {
    return [
      {
        group: "Property Portfolio",
        items: [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/properties", label: "My Properties", icon: FileBadge },
          { to: "/properties/new", label: "Add Property", icon: PlusCircle },
          { to: "/map", label: "GIS Cadastral Map", icon: Map },
          { to: "/properties/p_001/documents", label: "Property Documents", icon: FileText },
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
          { to: "/verification", label: "Verification Status", icon: Users2 },
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
  }

  let roleWorkspace: NavGroup;

  switch (role) {
    case "surveyor":
      roleWorkspace = {
        group: "Surveyor Workspace",
        items: [
          { to: "/surveyor", label: "Surveyor Dashboard", icon: LayoutDashboard },
          { to: "/surveyor/assignments", label: "Assignments", icon: Briefcase },
          { to: "/map", label: "GIS Map", icon: Map },
          { to: "/ai-boundary", label: "Boundary Detection", icon: Compass },
          { to: "/ai-satellite", label: "Satellite Compare", icon: Satellite },
          { to: "/verification", label: "Property Verification", icon: Users2 },
          { to: "/properties/p_001/documents", label: "Property Documents", icon: FileText },
          { to: "/reports", label: "Reports & Logs", icon: FileBadge },
          { to: "/ai-suggestions", label: "Verification AI", icon: Sparkles },
          { to: "/ai-risk", label: "Risk Analysis", icon: Activity },
          { to: "/profile", label: "Surveyor Profile", icon: User },
          { to: "/notifications", label: "Notifications", icon: Bell },
        ],
      };
      break;

    case "government":
      roleWorkspace = {
        group: "Government Registry",
        items: [
          { to: "/government", label: "Government Dashboard", icon: Building2 },
          { to: "/government/parcels", label: "Cadastral Parcels", icon: FileBadge },
          { to: "/verification", label: "Verification Queue", icon: Users2 },
          { to: "/government/disputes", label: "Registry Disputes", icon: Gavel },
          { to: "/fraud", label: "Fraud Cases", icon: ShieldAlert },
          { to: "/government/audit", label: "Audit Ledger", icon: ListChecks },
          { to: "/government/permits", label: "Building Permits", icon: FileText },
          { to: "/reports", label: "Official Reports", icon: FileBadge },
          { to: "/map", label: "GIS Cadastral Map", icon: Map },
          { to: "/ai-risk", label: "Risk Intelligence", icon: Activity },
          { to: "/analytics", label: "Jurisdiction Analytics", icon: BarChart3 },
          { to: "/profile", label: "Officer Profile", icon: User },
        ],
      };
      break;

    case "community":
      roleWorkspace = {
        group: "Community Verifier",
        items: [
          { to: "/community", label: "Community Dashboard", icon: Users2 },
          { to: "/verification", label: "Neighborhood Verification", icon: ShieldCheck },
          { to: "/attestations", label: "Attestations Ledger", icon: ListChecks },
          { to: "/disputes", label: "Community Disputes", icon: Gavel },
          { to: "/map", label: "GIS Community Map", icon: Map },
          { to: "/reports", label: "Evidence Reports", icon: FileText },
          { to: "/notifications", label: "Community Alerts", icon: Bell },
          { to: "/profile", label: "Verifier Profile", icon: User },
          { to: "/support", label: "Help & Support", icon: LifeBuoy },
        ],
      };
      break;

    case "bank":
      roleWorkspace = {
        group: "Bank & Lending",
        items: [
          { to: "/bank", label: "Bank Dashboard", icon: Banknote },
          { to: "/properties/p_001/verify", label: "Passport Verification", icon: ShieldCheck },
          { to: "/ai-valuation", label: "Valuation Engine", icon: Sparkles },
          { to: "/bank/loans", label: "Mortgage Underwriting", icon: Banknote },
          { to: "/ai-risk", label: "Collateral Risk", icon: Activity },
          { to: "/search", label: "Property Search", icon: Search },
          { to: "/map", label: "GIS Collateral Map", icon: Map },
          { to: "/reports", label: "Audit Reports", icon: FileBadge },
          { to: "/ai-passport", label: "AI Passport Review", icon: FileBadge },
          { to: "/profile", label: "Banker Profile", icon: User },
        ],
      };
      break;

    case "admin":
      roleWorkspace = {
        group: "Admin Operations",
        items: [
          { to: "/admin", label: "Admin Dashboard", icon: ShieldCheck },
          { to: "/admin/users", label: "User Management", icon: User },
          { to: "/admin/roles", label: "RBAC & Permissions", icon: Shield },
          { to: "/admin/regions", label: "Jurisdictions & Regions", icon: Building2 },
          { to: "/admin/audit", label: "System Audit Logs", icon: ListChecks },
          { to: "/admin/system", label: "System Health & Nodes", icon: Activity },
          { to: "/admin/api-keys", label: "API Credentials", icon: FolderLock },
          { to: "/integrations", label: "n8n & External Services", icon: Sparkles },
          { to: "/analytics", label: "System Analytics", icon: BarChart3 },
          { to: "/security", label: "Security Center", icon: ShieldAlert },
          { to: "/admin/feedback", label: "User Feedback", icon: MessageSquare },
          { to: "/support", label: "Support Desk", icon: LifeBuoy },
        ],
      };
      break;

    default:
      roleWorkspace = {
        group: "Workspace",
        items: [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/properties", label: "Properties", icon: FileBadge },
        ],
      };
      break;
  }

  return [
    roleWorkspace,
    {
      group: "AI Intelligence",
      items: [
        { to: "/ai", label: "AI Overview", icon: Brain },
        { to: "/ai-passport", label: "AI Passport", icon: FileBadge },
        { to: "/ai-valuation", label: "Valuation Engine", icon: Sparkles },
        { to: "/ai-ocr", label: "Document OCR", icon: ScanLine },
        { to: "/ai-fraud", label: "Fraud Detection", icon: ShieldAlert },
        { to: "/ai-risk", label: "Risk Analysis", icon: Activity },
        { to: "/ai-confidence", label: "Confidence Score", icon: ShieldCheck },
        { to: "/ai-boundary", label: "Boundary Detection", icon: Compass },
        { to: "/ai-satellite", label: "Satellite Compare", icon: Satellite },
        { to: "/ai-land-health", label: "Land Health", icon: Leaf },
        { to: "/ai-timeline", label: "Ownership Timeline", icon: ListChecks },
        { to: "/ai-recommendations", label: "Recommendations", icon: Lightbulb },
        { to: "/ai-summary", label: "Document Summary", icon: FileText },
        { to: "/ai-suggestions", label: "Verification AI", icon: Sparkles },
      ],
    },
    {
      group: "Trust & Governance",
      items: [
        { to: "/verification", label: "Verification", icon: Users2 },
        { to: "/fraud", label: "Fraud Detection", icon: ShieldAlert },
        { to: "/disputes", label: "Disputes", icon: Gavel },
        { to: "/reports", label: "Reports", icon: FileText },
      ],
    },
    {
      group: "Account",
      items: [
        { to: "/profile", label: "Profile", icon: User },
        { to: "/notifications", label: "Notifications", icon: Bell },
        { to: "/settings", label: "Settings", icon: Settings },
        { to: "/support", label: "Support", icon: LifeBuoy },
        { to: "/help", label: "Help Center", icon: HelpCircle },
      ],
    },
  ];
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
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 capitalize", s.tone)}>
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
  const pathname = useRouterState({ select: s => s.location.pathname });
  const navigate = useNavigate();
  const { user, profile, signOut, setDemoRole } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  const currentRole: Role = normalizeRole(profile?.role || user?.user_metadata?.role || "citizen");
  const displayName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split("@")[0] : "Kushal Santhosh");
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
    const allowed = Array.isArray(requiredRole)
      ? requiredRole.map(normalizeRole)
      : [normalizeRole(requiredRole)];
    return allowed.includes(currentRole);
  };

  const rolesList: { id: Role; label: string }[] = [
    { id: "citizen", label: "Citizen / Property Owner" },
    { id: "surveyor", label: "Licensed Land Surveyor" },
    { id: "government", label: "Revenue & Land Officer" },
    { id: "community", label: "Community Verifier" },
    { id: "bank", label: "Mortgage / Bank Underwriter" },
    { id: "admin", label: "System Administrator" },
  ];

  useEffect(() => {
    if (requiredRole) {
      const allowed = Array.isArray(requiredRole)
        ? requiredRole.map(normalizeRole)
        : [normalizeRole(requiredRole)];
      if (!allowed.includes(currentRole)) {
        setDemoRole?.(allowed[0]);
      }
    }
  }, [requiredRole, currentRole, setDemoRole]);

  return (
    <div className="flex min-h-screen w-full flex-col md:grid md:grid-cols-[280px_1fr] bg-background">
      {/* Left Sidebar */}
      <aside className="hidden md:flex sticky top-0 h-screen border-r border-border bg-surface-elevated flex-col justify-between">
        <div className="flex flex-col h-[calc(100vh-4.5rem)]">
          <div className="flex h-16 items-center justify-between px-5 border-b border-border/40 shrink-0">
            <Link to="/"><Logo /></Link>
            {currentRole !== "citizen" ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition"
                >
                  <span>{roleLabel}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {roleMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-border bg-popover p-1.5 shadow-xl z-50">
                    <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Switch Prototype Role</p>
                    {rolesList.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setDemoRole?.(r.id);
                          setRoleMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition",
                          currentRole === r.id ? "bg-primary text-primary-foreground font-semibold" : "text-popover-foreground hover:bg-muted"
                        )}
                      >
                        <span>{r.label}</span>
                        {currentRole === r.id && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                <span>{roleLabel}</span>
              </div>
            )}
          </div>
          
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" suppressHydrationWarning>
            {getNavForRole(currentRole).map(group => (
              <div key={group.group}>
                <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80" suppressHydrationWarning>
                  {group.group}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map(item => {
                    const active = pathname === item.to || (item.to !== "/dashboard" && item.to !== "/" && pathname.startsWith(item.to));
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition",
                          active
                            ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/25 shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/85 px-4 md:px-8 backdrop-blur-xl">
          <div className="flex items-center md:hidden mr-1">
            <Link to="/"><Logo /></Link>
          </div>
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
                <p className="text-xs font-medium leading-tight text-foreground truncate max-w-[140px]" suppressHydrationWarning>{displayName}</p>
                <p className="text-[10px] capitalize text-muted-foreground" suppressHydrationWarning>{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Title & Actions Banner */}
        <div className="border-b border-border bg-background px-4 md:px-8 py-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
              {subtitle && <p className="mt-1 text-xs md:text-sm text-muted-foreground">{subtitle}</p>}
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
                This workspace requires <span className="font-semibold text-foreground">{Array.isArray(requiredRole) ? requiredRole.join(", ") : requiredRole}</span> role authorization. You are currently signed in as a <span className="font-semibold text-primary">{roleLabel}</span>.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button onClick={() => navigate({ to: "/dashboard" })}>
                  Return to my workspace
                </Button>
                {currentRole !== "citizen" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const target = Array.isArray(requiredRole) ? requiredRole[0] : requiredRole;
                      if (target) setDemoRole?.(normalizeRole(target));
                    }}
                  >
                    Switch to {Array.isArray(requiredRole) ? requiredRole[0] : requiredRole}
                  </Button>
                )}
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
