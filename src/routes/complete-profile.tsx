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
            <Select defaultValue="in"><SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">India (Bharat)</SelectItem>
              </SelectContent></Select>
          </div>
          <div className="grid gap-2"><Label>State / Union Territory</Label>
            <Select defaultValue="karnataka"><SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="karnataka">Karnataka</SelectItem>
                <SelectItem value="maharashtra">Maharashtra</SelectItem>
                <SelectItem value="haryana">Haryana (NCR)</SelectItem>
                <SelectItem value="delhi">Delhi (NCT)</SelectItem>
                <SelectItem value="telangana">Telangana</SelectItem>
                <SelectItem value="tamilnadu">Tamil Nadu</SelectItem>
                <SelectItem value="gujarat">Gujarat</SelectItem>
                <SelectItem value="up">Uttar Pradesh</SelectItem>
              </SelectContent></Select>
          </div>
        </div>
        <div className="grid gap-2"><Label>National ID number</Label><Input className="h-11" placeholder="Aadhaar / Voter ID / PAN" /></div>
        <div className="grid gap-2"><Label>Phone</Label><Input className="h-11" placeholder="+91 98450 12345" /></div>
        <div className="grid gap-2"><Label>Short bio (optional)</Label><Textarea rows={3} placeholder="A few words about you" /></div>
        <Button className="h-11">Enter the platform</Button>
      </form>
    </AuthLayout>
  );
}
