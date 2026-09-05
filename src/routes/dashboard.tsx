import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui-ext/StatCard";
import { TrustScore } from "@/components/ui-ext/TrustScore";
import { Button } from "@/components/ui/button";
import { citizenKpis, notifications, properties as fallbackProperties, verificationsOverTime } from "@/lib/mock-data";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ArrowRight, Plus, Sparkles, Bell } from "lucide-react";
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
  const [timeRange, setTimeRange] = useState("Last 8 months");
  const [userProperties, setUserProperties] = useState<Property[]>(fallbackProperties);

  const userName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split("@")[0] : "Citizen");

  useEffect(() => {
    if (user?.id) {
      loadOwnedProperties(user.id).then((props) => {
        if (props && props.length) {
          setUserProperties(props);
        }
      });
    }
  }, [user?.id]);

  const verifiedCount = userProperties.filter(p => p.status === "verified").length;
  const pendingCount = userProperties.filter(p => p.status === "pending").length;
  const disputedCount = userProperties.filter(p => p.status === "disputed").length;
  const avgTrust = userProperties.length
    ? Math.round(userProperties.reduce((acc, p) => acc + (p.trustScore || 0), 0) / userProperties.length)
    : 74;

  const actionItems = [
    { title: "Upload tax receipt", desc: "Mysuru Farmstead · raises trust by +12", to: "/properties/p_002" },
    { title: "Confirm boundary walk", desc: "Bengaluru Residence · surveyor visit Sat", to: "/properties/p_001" },
    { title: "Respond to dispute notice", desc: "Gurugram Commercial Plot · 3 days left", to: "/disputes/d_001" },
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
        {citizenKpis.map(k => <StatCard key={k.label} kpi={k} />)}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Verifications over time</p>
              <p className="text-xs text-muted-foreground">Monthly verification trends across registered parcels</p>
            </div>
            <select
              aria-label="Filter verification timeframe"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-foreground cursor-pointer"
            >
              <option value="Last 8 months">Last 8 months</option>
              <option value="Last 12 months">Last 12 months</option>
            </select>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={verificationsOverTime}>
                <defs>
                  <linearGradient id="v" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.45 0.08 195)" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="oklch(0.45 0.08 195)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.92 0.008 250)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.018 255)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.018 255)" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.008 250)", fontSize: 12 }} />
                <Area type="monotone" dataKey="verified" stroke="oklch(0.45 0.08 195)" fill="url(#v)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card flex flex-col p-5">
          <p className="font-medium">Portfolio Trust Score</p>
          <p className="text-xs text-muted-foreground">Weighted trust metric across your registered properties</p>
          <div className="my-6 flex justify-center"><TrustScore value={avgTrust} size={150} /></div>
          <div className="space-y-2 text-sm">
            <Row label="Verified" value={String(verifiedCount)} color="bg-success" />
            <Row label="Pending" value={String(pendingCount)} color="bg-warning" />
            <Row label="Disputed" value={String(disputedCount)} color="bg-destructive" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium">My properties</p>
            <Link to="/properties" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
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
                {userProperties.map(p => (
                  <tr key={p.id} className="hover:bg-muted/40 transition">
                    <td className="px-3 py-3">
                      <Link to="/properties/$id" params={{ id: p.id }} className="font-medium text-foreground hover:text-primary transition">
                        {p.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{p.address}</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-primary font-medium">{p.passportId}</td>
                    <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-3 py-3"><TrustPill v={p.trustScore} /></td>
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
            <Link to="/notifications" className="text-xs text-primary hover:underline">All notifications</Link>
          </div>
          <ul className="space-y-3">
            {notifications.slice(0, 4).map(n => (
              <li key={n.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition">
                <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.kind === "success" ? "bg-success" : n.kind === "warning" ? "bg-warning" : n.kind === "alert" ? "bg-destructive" : "bg-primary"}`} />
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
          <MapMock properties={userProperties} highlightId="p_001" height={360} />
        </div>
        <div className="surface-card flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <p className="font-medium">Actions for you</p>
          </div>
          <p className="text-xs text-muted-foreground">Pending verification tasks requiring your documentation or confirmation.</p>
          <div className="mt-1 space-y-2">
            {actionItems.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-muted/50 hover:border-primary/40 transition group"
              >
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition">{item.title}</p>
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
  const tone = v >= 85 ? "text-success bg-success/10" : v >= 65 ? "text-primary bg-primary/10" : v >= 45 ? "text-warning bg-warning/15" : "text-destructive bg-destructive/10";
  return <span className={`inline-flex w-12 justify-center rounded-md px-2 py-0.5 text-xs font-semibold ${tone}`}>{v}</span>;
}
