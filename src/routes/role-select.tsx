import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Users2, Briefcase, Building2, ShieldCheck, Banknote, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/role-select")({
  head: () => ({ meta: [{ title: "Choose your role — TerraTrust AI" }] }),
  component: RoleSelect,
});

const roles = [
  { id: "citizen", icon: Users2, t: "Citizen", d: "Manage and verify your own land." },
  { id: "surveyor", icon: Briefcase, t: "Surveyor", d: "Capture GIS boundaries on assignment." },
  { id: "officer", icon: Building2, t: "Government officer", d: "Operate registries and resolve disputes." },
  { id: "verifier", icon: HeartHandshake, t: "Community verifier", d: "Attest occupancy in your neighborhood." },
  { id: "admin", icon: ShieldCheck, t: "Administrator", d: "Manage platform operations and policy." },
  { id: "bank", icon: Banknote, t: "Bank (coming soon)", d: "Lend against verified collateral." },
];

function RoleSelect() {
  const [picked, setPicked] = useState("citizen");
  const navigate = useNavigate();
  return (
    <AuthLayout title="Pick your role" subtitle="This shapes the workspace we build for you. You can change it later.">
      <div className="grid gap-3">
        {roles.map(r => (
          <button key={r.id} disabled={r.id === "bank"} onClick={() => setPicked(r.id)}
            className={cn(
              "flex items-start gap-4 rounded-xl border p-4 text-left transition",
              picked === r.id ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "border-border hover:bg-muted",
              r.id === "bank" && "opacity-50",
            )}>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><r.icon className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{r.t}</p>
              <p className="text-sm text-muted-foreground">{r.d}</p>
            </div>
            <span className={cn("mt-1 h-4 w-4 rounded-full border-2", picked === r.id ? "border-primary bg-primary" : "border-border")} />
          </button>
        ))}
      </div>
      <Button className="mt-6 h-11 w-full" onClick={() => navigate({ to: "/complete-profile" })}>Continue</Button>
    </AuthLayout>
  );
}
