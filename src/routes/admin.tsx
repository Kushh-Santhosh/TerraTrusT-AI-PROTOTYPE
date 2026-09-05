import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui-ext/StatCard";
import { adminKpis } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Platform Administration — TerraTrust AI" }] }),
  component: AdminPage,
});

const users = [
  { n: "Kushal Santhosh", e: "kushal@terratrust.ai", r: "Citizen", s: "active" },
  { n: "Arjun Mehta", e: "arjun.surveyor@terratrust.ai", r: "Surveyor", s: "active" },
  { n: "Dr. Vandana Rao", e: "v.rao@revenue.karnataka.gov.in", r: "Officer", s: "active" },
  { n: "Rajendra Joshi", e: "r.joshi@community.terratrust.ai", r: "Verifier", s: "suspended" },
  { n: "System Administrator", e: "admin@terratrust.ai", r: "Admin", s: "active" },
];

function AdminPage() {
  return (
    <AppShell
      title="Platform Administrator"
      subtitle="Platform operations, role-based access management, and compliance controls."
      requiredRole="admin"
      actions={
        <Button asChild className="rounded-full">
          <Link to="/admin/audit">
            <ShieldCheck className="h-4 w-4" /> Audit log
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {adminKpis.map(k => (
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
              onClick={() => toast.info("User invitation dialog: enter email to dispatch magic onboarding link.")}
            >
              <UserPlus className="h-3.5 w-3.5" /> Invite user
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
            {users.map(u => (
              <tr key={u.e}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {u.n
                          .split(" ")
                          .map(s => s[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{u.n}</p>
                      <p className="text-xs text-muted-foreground">{u.e}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {u.r}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      u.s === "active" ? "text-success" : "text-warning"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        u.s === "active" ? "bg-success" : "bg-warning"
                      }`}
                    />
                    {u.s}
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
