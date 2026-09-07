import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { roleLabels, useAuth } from "@/lib/auth";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — TerraTrust AI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, saveProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? user?.user_metadata?.full_name ?? "");
  const [region, setRegion] = useState(profile?.region ?? user?.user_metadata?.region ?? "");
  const [saving, setSaving] = useState(false);
  const role = profile?.role ?? "citizen";
  const displayName = fullName || user?.email?.split("@")[0] || "TerraTrust user";
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const result = await saveProfile({ full_name: fullName, region });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated");
  };

  return (
    <AppShell title="Profile" subtitle="Your identity, verification status, and contact info.">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="surface-card flex flex-col items-center p-6 text-center">
          <Avatar className="h-24 w-24"><AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl text-primary-foreground">{initials}</AvatarFallback></Avatar>
          <p className="mt-4 font-display text-2xl">{displayName}</p>
          <p className="text-sm text-muted-foreground">{roleLabels[role]}{region ? ` · ${region}` : ""}</p>
          <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs text-success"><ShieldCheck className="h-3 w-3" /> Identity verified</div>
        </div>
        <div className="surface-card p-6">
          <p className="font-medium">Account information</p>
          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="grid gap-2"><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" value={fullName} onChange={(event) => setFullName(event.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="profile-email">Email</Label><Input id="profile-email" value={user?.email ?? ""} readOnly /></div>
            <div className="grid gap-2"><Label htmlFor="profile-region">Region</Label><Input id="profile-region" value={region} onChange={(event) => setRegion(event.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="profile-role">Role</Label><Input id="profile-role" value={roleLabels[role]} readOnly /></div>
            <div className="md:col-span-2"><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button></div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
