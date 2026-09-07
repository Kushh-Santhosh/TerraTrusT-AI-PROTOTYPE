import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Upload, FileText, ShieldCheck, AlertTriangle } from "lucide-react";
import { PropertySubNav } from "@/components/property/PropertySubNav";
import { loadPropertyById } from "@/lib/property-repository";
import { useState, useEffect } from "react";
import type { Property } from "@/lib/types";

export const Route = createFileRoute("/properties/$id/documents")({
  head: () => ({ meta: [{ title: "Documents — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    loadPropertyById(id).then((p) => {
      if (p) setProperty(p);
    });
  }, [id]);

  const docsToDisplay =
    property?.documents?.map((d) => ({
      name: d.name,
      kind: d.kind.toUpperCase(),
      size: "Stored document",
      at: d.uploadedAt,
      ocr: null,
      verified: d.verified,
    })) ?? [];

  return (
    <AppShell
      title="Property Documents"
      subtitle="Upload, verify, and inspect evidentiary land records for this Property Passport."
      actions={
        <Button asChild>
          <Link to="/properties/$id/verify" params={{ id }}>
            <Upload className="h-4 w-4 mr-1" /> Run Verification
          </Link>
        </Button>
      }
    >
      <Crumbs
        items={[
          { label: "Properties", to: "/properties" },
          { label: id, to: "/properties/$id" },
          { label: "Documents" },
        ]}
      />
      <PropertySubNav propertyId={id} activeTab="documents" />

      <div className="surface-card grid h-40 place-items-center rounded-xl border-2 border-dashed border-border bg-muted/20 text-center p-6">
        <div>
          <FileText className="mx-auto h-8 w-8 text-primary/60 mb-2" />
          <p className="text-sm font-medium">Evidentiary Title Vault</p>
          <p className="text-xs text-muted-foreground mt-1">
            Encrypted storage via Supabase Storage · Forensic OCR automatically runs on upload
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {docsToDisplay.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No persisted documents are attached to this property.
          </p>
        ) : (
          docsToDisplay.map((d) => (
            <div key={d.name} className="surface-card flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{d.name}</p>
                <p className="text-xs text-muted-foreground">
                  {d.kind} · {d.size} · Uploaded {d.at}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {d.ocr === null ? (
                  <Pill tone="warning">OCR unavailable</Pill>
                ) : (
                  <Pill tone={d.ocr > 95 ? "success" : "warning"}>OCR {d.ocr}%</Pill>
                )}
                {d.verified ? (
                  <Pill tone="success">
                    <ShieldCheck className="h-3 w-3 inline mr-1" /> Verified
                  </Pill>
                ) : (
                  <Pill tone="warning">
                    <AlertTriangle className="h-3 w-3 inline mr-1" /> Pending
                  </Pill>
                )}
                <Link
                  to="/properties/$id"
                  params={{ id }}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  View Passport
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
