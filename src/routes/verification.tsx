import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { loadGovernmentReviewQueue } from "@/lib/property-repository";
import { CheckCircle2, Users2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/verification")({
  head: () => ({ meta: [{ title: "Verification — TerraTrust AI" }] }),
  component: VerificationPage,
});

function VerificationPage() {
  const { profile } = useAuth();
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof loadGovernmentReviewQueue>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGovernmentReviewQueue().then((data) => {
      setQueue(data);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell
      title={
        profile?.role === "government"
          ? "Government Verification Queue"
          : "Surveyor Verification Evidence"
      }
      subtitle={
        profile?.role === "government"
          ? "Persisted manual-review cases and n8n verification outcomes for Government action."
          : "Persisted manual-review cases and n8n verification outcomes for field action."
      }
      requiredRole={["surveyor", "government"]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Tile icon={ShieldCheck} v={`${queue.length}`} l="Open review cases" />
        <Tile
          icon={CheckCircle2}
          v={`${queue.filter((item) => item.status === "verified").length}`}
          l="Verified queue records"
        />
        <Tile
          icon={Users2}
          v={`${queue.filter((item) => item.status === "pending").length}`}
          l="Pending Government review"
        />
      </div>

      <p className="mt-8 mb-3 text-sm font-medium text-foreground">Registry Verification Queue</p>
      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Loading persisted verification cases…
        </p>
      ) : queue.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No persisted Government review cases are available.
        </p>
      ) : (
        <div className="grid gap-4">
          {queue.map((item) => (
            <div key={item.caseId} className="surface-card flex flex-wrap items-center gap-4 p-5">
              <div className="flex-1 min-w-64">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {item.passportId} · {item.region}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <a href={`/properties/${item.propertyId}/verify`}>
                  <ShieldCheck className="h-4 w-4 mr-1 text-primary" /> Inspect verification
                </a>
              </Button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Tile({ icon: Icon, v, l }: { icon: any; v: string; l: string }) {
  return (
    <div className="surface-card flex items-center gap-4 p-5">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-display text-3xl">{v}</p>
        <p className="text-xs text-muted-foreground">{l}</p>
      </div>
    </div>
  );
}
