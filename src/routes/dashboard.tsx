import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui-ext/StatCard";
import { TrustScore } from "@/components/ui-ext/TrustScore";
import { Button } from "@/components/ui/button";
import { notifications } from "@/lib/mock-data";
import { ArrowRight, Plus, Sparkles, Bell, ShieldCheck, ClipboardCheck } from "lucide-react";
import { MapMock } from "@/components/ui-ext/MapMock";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { loadOwnedProperties } from "@/lib/property-repository";
import type { Property } from "@/lib/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TerraTrust AI" }] }),
  component: Dashboard,
});

function formatInr(val: number): string {
  if (!val) return "₹0";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} Lakh`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function Dashboard() {
  const { user, profile } = useAuth();
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const userName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "Citizen");

  useEffect(() => {
    if (user?.id) {
      loadOwnedProperties(user.id).then((props) => {
        setUserProperties(props || []);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const verifiedCount = userProperties.filter((p) => p.status === "verified").length;
  const pendingCount = userProperties.filter((p) => p.status === "pending").length;
  const disputedCount = userProperties.filter((p) => p.status === "disputed").length;
  const avgTrust = userProperties.length
    ? Math.round(
        userProperties.reduce((acc, p) => acc + (p.trustScore || 0), 0) / userProperties.length,
      )
    : 0;

  const actionItems =
    userProperties.length > 0
      ? [
          {
            title: "Review Verification Status",
            desc: `${userProperties[0].title} · Score: ${userProperties[0].trustScore}/100`,
            to: `/properties/${userProperties[0].id}/verify`,
          },
          ...(userProperties[1]
            ? [
                {
                  title: "Inspect Property Boundaries",
                  desc: `${userProperties[1].title} · Cadastral polygon`,
                  to: `/properties/${userProperties[1].id}/boundary`,
                },
              ]
            : []),
          {
            title: "Run Instant AI Valuation",
            desc: `${userProperties[0].title} · ${formatInr(userProperties[0].valuation || 24000000)}`,
            to: `/valuation`,
          },
        ]
      : [
          {
            title: "Register Your First Property",
            desc: "Mint tamper-evident Property Passport with AI OCR",
            to: "/properties/new",
          },
          {
            title: "Explore Cadastral Map",
            desc: "View national land parcels and high-resolution satellite layers",
            to: "/map",
          },
          {
            title: "AI Intelligence Suite",
            desc: "Document OCR, boundary detection, and risk analysis",
            to: "/ai",
          },
        ];

  return (
    <AppShell
      title={`Welcome back, ${userName}`}
      subtitle="Overview of your verified land parcels, Property Passports, and trust scores."
      actions={
        <div className="flex items-center gap-2">
          <Link to="/valuation">
            <Button variant="outline" className="rounded-full">
              <Sparkles className="h-4 w-4 mr-1 text-primary" /> Run AI valuation
            </Button>
          </Link>
          <Link to="/properties/new">
            <Button className="rounded-full">
              <Plus className="h-4 w-4 mr-1" /> New Property Passport
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          kpi={{
            label: "Properties",
            value: `${userProperties.length}`,
            delta: "+1",
            trend: "up",
            hint: "registered in portfolio",
          }}
        />
        <StatCard
          kpi={{
            label: "Avg. trust score",
            value: `${avgTrust}`,
            delta: "+4",
            trend: "up",
            hint: "rolling 30 days",
          }}
        />
        <StatCard
          kpi={{
            label: "Portfolio value",
            value: formatInr(userProperties.reduce((sum, p) => sum + (p.valuation || 0), 0)),
            delta: "+4.2%",
            trend: "up",
            hint: "AI valuation estimate",
          }}
        />
        <StatCard
          kpi={{
            label: "Open actions",
            value: `${disputedCount + pendingCount}`,
            delta: "-1",
            trend: "down",
            hint: "pending verifications",
          }}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">Land Property Evaluation</p>
              <p className="text-xs text-muted-foreground">
                Current estimated value and verification outlook from your persisted property
                records
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          {userProperties[0] ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Current estimated value</p>
                <p className="mt-1 font-display text-2xl">
                  {userProperties[0].valuation
                    ? formatInr(userProperties[0].valuation)
                    : "Valuation pending"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Verification</p>
                <p className="mt-1 font-display text-2xl">{userProperties[0].trustScore} / 100</p>
                <p className="text-xs text-muted-foreground">
                  {userProperties[0].surveyorDecision === "verified"
                    ? "Surveyor field verification complete"
                    : "Surveyor verification pending"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Future outlook</p>
                <p className="mt-1 text-sm font-medium">Projection unavailable</p>
                <p className="text-xs text-muted-foreground">
                  More market/property data is required.
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-6 rounded-lg border border-border p-5 text-sm text-muted-foreground">
              Valuation pending. Register a property to run AI valuation.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {userProperties[0] && (
              <Link to="/properties/$id" params={{ id: userProperties[0].id }}>
                <Button variant="outline" size="sm">
                  <ClipboardCheck className="mr-1.5 h-4 w-4" /> View verification
                </Button>
              </Link>
            )}
            <Link to="/valuation">
              <Button size="sm">
                <Sparkles className="mr-1.5 h-4 w-4" /> Run AI valuation
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            AI-estimated scenario — not a guaranteed market return.
          </p>
        </div>

        <div className="surface-card flex flex-col p-5">
          <p className="font-medium">Portfolio Trust Score</p>
          <p className="text-xs text-muted-foreground">
            Weighted trust metric across your registered properties
          </p>
          <div className="my-6 flex justify-center">
            <TrustScore value={avgTrust} size={150} />
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Verified" value={String(verifiedCount)} color="bg-success" />
            <Row label="Pending" value={String(pendingCount)} color="bg-warning" />
            <Row label="Disputed" value={String(disputedCount)} color="bg-destructive" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2 min-w-0 overflow-hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium">My properties</p>
            <Link
              to="/properties"
              className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Property</th>
                  <th className="px-3 py-2 font-medium">Passport ID</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Trust Score</th>
                  <th className="px-3 py-2 font-medium text-right">Valuation (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {userProperties.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-xs text-muted-foreground">
                      No registered properties in your portfolio yet. Click{" "}
                      <Link
                        to="/properties/new"
                        className="text-primary font-medium hover:underline"
                      >
                        &quot;New Property Passport&quot;
                      </Link>{" "}
                      to register your first parcel.
                    </td>
                  </tr>
                )}
                {userProperties.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40 transition">
                    <td className="px-3 py-3">
                      <Link
                        to="/properties/$id"
                        params={{ id: p.id }}
                        className="font-medium text-foreground hover:text-primary transition"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{p.address}</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-primary font-medium">
                      {p.passportId}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-3 py-3">
                      <TrustPill v={p.trustScore} />
                    </td>
                    <td className="px-3 py-3 text-right font-medium">{formatInr(p.valuation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium">Recent Notifications</p>
            <Link to="/notifications" className="text-xs text-primary hover:underline">
              All notifications
            </Link>
          </div>
          <ul className="space-y-3">
            {notifications.slice(0, 4).map((n) => (
              <li
                key={n.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition"
              >
                <span
                  className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.kind === "success" ? "bg-success" : n.kind === "warning" ? "bg-warning" : n.kind === "alert" ? "bg-destructive" : "bg-primary"}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{n.at}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="mb-3 text-sm font-medium">Cadastral & Parcel Boundaries</p>
          <MapMock properties={userProperties} highlightId={userProperties[0]?.id} height={360} />
        </div>
        <div className="surface-card flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <p className="font-medium">Actions for you</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Pending verification tasks requiring your documentation or confirmation.
          </p>
          <div className="mt-1 space-y-2">
            {actionItems.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-muted/50 hover:border-primary/40 transition group"
              >
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function TrustPill({ v }: { v: number }) {
  const tone =
    v >= 85
      ? "text-success bg-success/10"
      : v >= 65
        ? "text-primary bg-primary/10"
        : v >= 45
          ? "text-warning bg-warning/15"
          : "text-destructive bg-destructive/10";
  return (
    <span
      className={`inline-flex w-12 justify-center rounded-md px-2 py-0.5 text-xs font-semibold ${tone}`}
    >
      {v}
    </span>
  );
}
