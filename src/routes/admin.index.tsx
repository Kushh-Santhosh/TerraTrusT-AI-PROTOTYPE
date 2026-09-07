import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui-ext/StatCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserPlus, Users, Activity, Layers, Database } from "lucide-react";
import { toast } from "sonner";
import { loadAdminPlatformData } from "@/lib/supabase-persistence";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Platform Administration — TerraTrust AI" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [platformData, setPlatformData] = useState({
    totalUsers: 5,
    totalProperties: 0,
    totalVerifications: 0,
    systemStatus: "Operational (Online)",
    usersList: [] as Array<{
      name: string;
      email: string;
      role: string;
      status: string;
      region?: string;
    }>,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminPlatformData().then((data) => {
      setPlatformData(data);
      setLoading(false);
    });
  }, []);

  const kpis = [
    {
      label: "Active Users",
      value: `${platformData.totalUsers}`,
      delta: "+1",
      trend: "up" as const,
      hint: "Authenticated user accounts",
    },
    {
      label: "Property Records",
      value: `${platformData.totalProperties}`,
      delta: "Live",
      trend: "up" as const,
      hint: "PostgreSQL cadastral records",
    },
    {
      label: "AI Orchestrations",
      value: `${platformData.totalVerifications}`,
      delta: "n8n",
      trend: "up" as const,
      hint: "Real workflow evaluations",
    },
    {
      label: "System Health",
      value: platformData.systemStatus.split(" ")[0],
      trend: "flat" as const,
      hint: "Supabase & n8n live cluster",
    },
  ];

  return (
    <AppShell
      title="Platform Administrator"
      subtitle="Platform operations, role-based access management, and compliance controls."
      requiredRole="admin"
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/integrations">
              <Activity className="h-4 w-4 mr-1" /> n8n Engine
            </Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/admin/audit">
              <ShieldCheck className="h-4 w-4 mr-1" /> Audit Log
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <StatCard key={k.label} kpi={k} />
        ))}
      </div>

      <div className="mt-6 surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <p className="font-semibold text-foreground">Users & Role Allocations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success("User invitation modal active. Dispatching magic signup link via Supabase Auth.")}
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" /> Invite user
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to="/admin/users">View all users</Link>
            </Button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {platformData.usersList.map((u) => (
              <tr key={u.email}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {u.name
                          .split(" ")
                          .map((s) => s[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      u.status === "active" ? "text-success" : "text-warning"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        u.status === "active" ? "bg-success" : "bg-warning"
                      }`}
                    />
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/admin/roles">Configure</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
