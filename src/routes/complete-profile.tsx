import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/complete-profile")({
  head: () => ({ meta: [{ title: "Complete profile — TerraTrust AI" }] }),
  component: CompleteProfile,
});

function CompleteProfile() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Complete your profile" subtitle="A few details so authorities can verify you against records.">
      <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/dashboard" }); }} className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2"><Label>Country</Label>
            <Select defaultValue="ng"><SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ng">Nigeria</SelectItem>
                <SelectItem value="ke">Kenya</SelectItem>
                <SelectItem value="gh">Ghana</SelectItem>
                <SelectItem value="za">South Africa</SelectItem>
                <SelectItem value="in">India</SelectItem>
              </SelectContent></Select>
          </div>
          <div className="grid gap-2"><Label>Region / State</Label><Input className="h-11" defaultValue="Lagos" /></div>
        </div>
        <div className="grid gap-2"><Label>National ID number</Label><Input className="h-11" placeholder="NIN / Aadhaar / etc." /></div>
        <div className="grid gap-2"><Label>Phone</Label><Input className="h-11" placeholder="+234 ..." /></div>
        <div className="grid gap-2"><Label>Short bio (optional)</Label><Textarea rows={3} placeholder="A few words about you" /></div>
        <Button className="h-11">Enter the platform</Button>
      </form>
    </AuthLayout>
  );
}
