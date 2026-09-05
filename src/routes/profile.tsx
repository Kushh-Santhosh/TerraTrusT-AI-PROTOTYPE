import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { currentUser } from "@/lib/mock-data";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — TerraTrust AI" }] }),
  component: () => (
    <AppShell title="Profile" subtitle="Your identity, verification status, and contact info.">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="surface-card flex flex-col items-center p-6 text-center">
          <Avatar className="h-24 w-24"><AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl text-primary-foreground">AO</AvatarFallback></Avatar>
          <p className="mt-4 font-display text-2xl">{currentUser.name}</p>
          <p className="text-sm text-muted-foreground capitalize">{currentUser.role} · {currentUser.region}</p>
          <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs text-success"><ShieldCheck className="h-3 w-3" /> Identity verified</div>
          <Button variant="outline" size="sm" className="mt-6 w-full">Change photo</Button>
        </div>
        <div className="surface-card p-6">
          <p className="font-medium">Account information</p>
          <form className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="grid gap-2"><Label>Full name</Label><Input defaultValue={currentUser.name} /></div>
            <div className="grid gap-2"><Label>Email</Label><Input defaultValue={currentUser.email} /></div>
            <div className="grid gap-2"><Label>Phone</Label><Input defaultValue="+234 803 555 0102" /></div>
            <div className="grid gap-2"><Label>Region</Label><Input defaultValue={currentUser.region} /></div>
            <div className="grid gap-2 md:col-span-2"><Label>Bio</Label><Textarea rows={3} defaultValue="Owner of family properties in Lagos and Oyo. Active in community verification." /></div>
            <div className="md:col-span-2"><Button>Save changes</Button></div>
          </form>
        </div>
      </div>
    </AppShell>
  ),
});
