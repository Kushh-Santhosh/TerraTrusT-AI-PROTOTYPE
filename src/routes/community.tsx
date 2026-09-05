import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui-ext/Scaffold";
import { ThumbsUp, ThumbsDown, MapPin, Users2, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { recordCommunityDecision } from "@/lib/supabase-persistence";
import { toast } from "sonner";

export const Route = createFileRoute("/community")({
  head: () => ({ meta: [{ title: "Community Verification — TerraTrust AI" }] }),
  component: Page,
});

interface CommunityItem {
  passport: string;
  title: string;
  region: string;
  neighbours: number;
  attestations: number;
  owner: string;
  years: number;
}

const initialItems: CommunityItem[] = [
  { passport: "KA-BLR-0412", title: "Koramangala 4th Block Villa", region: "Bengaluru, Karnataka", neighbours: 8, attestations: 6, owner: "R. Narayanan", years: 18 },
  { passport: "MH-PUN-0891", title: "Kalyani Nagar Plot", region: "Pune, Maharashtra", neighbours: 11, attestations: 9, owner: "P. Deshmukh", years: 12 },
  { passport: "KA-MYS-0143", title: "Gokulam Residential Plot", region: "Mysuru, Karnataka", neighbours: 6, attestations: 4, owner: "S. Murthy", years: 25 },
  { passport: "DL-GUR-0518", title: "DLF Phase 2 Parcel", region: "Gurugram, Haryana", neighbours: 7, attestations: 5, owner: "A. Bhatnagar", years: 10 },
];

function Page() {
  const [items, setItems] = useState<CommunityItem[]>(initialItems);
  const [decisions, setDecisions] = useState<Record<string, "attested" | "disputed">>({});
  const [loadingPassport, setLoadingPassport] = useState<string | null>(null);

  const handleDecision = async (item: CommunityItem, decision: "attested" | "disputed") => {
    setLoadingPassport(item.passport);
    try {
      const outcome = await recordCommunityDecision({
        passportId: item.passport,
        decision: decision === "attested" ? "attested" : "objected",
      });

      setDecisions(prev => ({ ...prev, [item.passport]: decision }));

      if (decision === "attested") {
        setItems(prev =>
          prev.map(p =>
            p.passport === item.passport ? { ...p, attestations: p.attestations + 1 } : p
          )
        );
        toast.success(`Attestation recorded for ${item.title} (${item.passport}).`);
      } else {
        toast.warning(`Dispute filed for ${item.title} (${item.passport}). Queued for surveyor review.`);
      }

      if (outcome.error) {
        console.warn("RPC notice:", outcome.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record consensus");
    } finally {
      setLoadingPassport(null);
    }
  };

  return (
    <AppShell
      title="Community verification"
      subtitle="Strengthen land registry trust by attesting to properties in your local neighborhood."
      requiredRole={["community", "admin"]}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {items.map(p => {
          const userDecision = decisions[p.passport];
          const isLoading = loadingPassport === p.passport;

          return (
            <div key={p.passport} className="surface-card flex flex-col justify-between gap-3 p-5">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-muted-foreground">{p.passport}</p>
                    <p className="font-medium text-foreground">{p.title}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {p.region}
                    </p>
                  </div>
                  <Pill tone={userDecision === "attested" ? "success" : userDecision === "disputed" ? "danger" : "info"}>
                    {p.attestations}/{p.neighbours} attested
                  </Pill>
                </div>

                <p className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  Owner <span className="font-medium text-foreground">{p.owner}</span> has occupied this parcel for ~{p.years} years. Do you recognise them as the lawful occupant?
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {userDecision ? (
                  <div
                    className={`flex items-center gap-2 rounded-lg p-3 text-xs ${
                      userDecision === "attested"
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}
                  >
                    {userDecision === "attested" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>You attested to this property. Your signature is recorded.</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Dispute filed. Sent to government verification desk.</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-primary/30 hover:bg-primary/10 hover:text-primary"
                      disabled={isLoading}
                      onClick={() => handleDecision(p, "attested")}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                      Yes, attest
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 hover:bg-destructive/10 hover:text-destructive"
                      disabled={isLoading}
                      onClick={() => handleDecision(p, "disputed")}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                      Dispute
                    </Button>
                  </div>
                )}

                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users2 className="h-3 w-3" /> {p.neighbours} verified neighbours in consensus radius
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
