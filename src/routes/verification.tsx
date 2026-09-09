import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  loadGovernmentReviewQueue,
  loadOwnedProperties,
  loadPropertyVerification,
} from "@/lib/property-repository";
import { CheckCircle2, Users2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/verification")({
  head: () => ({ meta: [{ title: "Verification — TerraTrust AI" }] }),
  component: VerificationPage,
});

function VerificationPage() {
  const { profile, user } = useAuth();
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof loadGovernmentReviewQueue>>>([]);
  const [ownedProperties, setOwnedProperties] = useState<
    Awaited<ReturnType<typeof loadOwnedProperties>>
  >([]);
  const [verificationResults, setVerificationResults] = useState<
    Record<string, Awaited<ReturnType<typeof loadPropertyVerification>>>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === "citizen" && user?.id) {
      loadOwnedProperties(user.id).then(async (properties) => {
        setOwnedProperties(properties);
        const results = await Promise.all(
          properties.map(
            async (property) => [property.id, await loadPropertyVerification(property.id)] as const,
          ),
        );
        setVerificationResults(Object.fromEntries(results));
        setLoading(false);
      });
      return;
    }
    if (
      profile?.role === "surveyor" ||
      profile?.role === "government" ||
      profile?.role === "bank"
    ) {
      loadGovernmentReviewQueue().then((data) => {
        setQueue(data);
        setLoading(false);
      });
    }
  }, [profile?.role, user?.id]);

  const isCitizen = profile?.role === "citizen";

  return (
    <AppShell
      title={
        isCitizen
          ? "Verification Status"
          : profile?.role === "government"
            ? "Government Verification Queue"
            : "Surveyor Verification Evidence"
      }
      subtitle={
        isCitizen
          ? "Track the persisted verification state of your own Property Passports."
          : profile?.role === "government"
            ? "Persisted manual-review cases and n8n verification outcomes for Government action."
            : "Persisted manual-review cases and n8n verification outcomes for field action."
      }
      requiredRole={["citizen", "surveyor", "government", "bank"]}
    >
      {isCitizen ? (
        <CitizenVerificationStatus
          loading={loading}
          properties={ownedProperties}
          verificationResults={verificationResults}
        />
      ) : (
        <>
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

          <p className="mt-8 mb-3 text-sm font-medium text-foreground">
            Registry Verification Queue
          </p>
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
                <div
                  key={item.caseId}
                  className="surface-card flex flex-wrap items-center gap-4 p-5"
                >
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
        </>
      )}
    </AppShell>
  );
}

function CitizenVerificationStatus({
  loading,
  properties,
  verificationResults,
}: {
  loading: boolean;
  properties: Awaited<ReturnType<typeof loadOwnedProperties>>;
  verificationResults: Record<string, Awaited<ReturnType<typeof loadPropertyVerification>>>;
}) {
  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Loading your persisted verification status…
      </p>
    );
  }
  if (!properties.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No submitted properties or verification records found.
      </p>
    );
  }
  return (
    <div className="grid gap-4">
      {properties.map((property) => {
        const result = verificationResults[property.id];
        const resultStatus =
          result?.result && typeof result.result === "object" && "status" in result.result
            ? String(result.result.status)
            : null;
        const status =
          resultStatus ||
          property.governmentDecision ||
          property.surveyorDecision ||
          property.status;
        return (
          <div key={property.id} className="surface-card flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-64 flex-1">
              <p className="font-medium">{property.title}</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {property.passportId} · {property.region}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Persisted verification state: {status}
              </p>
            </div>
            <StatusBadge status={status} />
          </div>
        );
      })}
    </div>
  );
}

function Tile({
  icon: Icon,
  v,
  l,
}: {
  icon: ComponentType<{ className?: string }>;
  v: string;
  l: string;
}) {
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
