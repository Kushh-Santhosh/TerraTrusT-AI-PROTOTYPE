import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, KpiRow, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { loadInstitutionalProperties } from "@/lib/property-repository";
import type { Property } from "@/lib/types";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/government/parcels")({
  head: () => ({ meta: [{ title: "Parcels Registry — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstitutionalProperties().then((data) => {
      setProperties(data);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell
      title="Land Records Registry"
      subtitle="Read-only access to persisted citizen parcels and their current registry review state."
      requiredRole={["government", "admin"]}
      actions={
        <Button
          variant="outline"
          onClick={() =>
            toast.success("Exporting regional cadastre CSV (Karnataka & Maharashtra zones)...")
          }
        >
          <Download className="h-4 w-4" /> Export region
        </Button>
      }
    >
      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">STATE CADASTRAL REGISTRY:</strong> Read-only access to
        state cadastral parcel registry synchronized with state revenue datasets.
      </div>

      <KpiRow
        items={[
          { label: "Total cadastral parcels", value: `${properties.length}` },
          {
            label: "Verified / clean title",
            value: `${properties.filter((p) => p.status === "verified").length}`,
          },
          {
            label: "Pending verification",
            value: `${properties.filter((p) => p.status === "pending").length}`,
          },
          {
            label: "Encumbered / disputed",
            value: `${properties.filter((p) => p.status === "disputed").length}`,
          },
        ]}
      />
      <div className="mt-6">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Loading persisted parcels…
          </p>
        ) : properties.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No persisted citizen parcels are available to this Government workspace.
          </p>
        ) : (
          <DataTable
            rows={properties}
            columns={[
              {
                key: "id",
                label: "Passport ID",
                render: (r) => (
                  <span className="font-mono text-xs font-medium">{r.passportId}</span>
                ),
              },
              { key: "region", label: "State", render: (r) => r.region },
              {
                key: "taluk",
                label: "Address",
                render: (r) => <span className="text-muted-foreground">{r.address}</span>,
              },
              { key: "area", label: "Area", render: (r) => `${r.area.toLocaleString()} sqm` },
              {
                key: "owner",
                label: "Owner of Record",
                render: (r) => <span className="text-muted-foreground">{r.owner}</span>,
              },
              {
                key: "s",
                label: "Status",
                render: (r) => (
                  <Pill
                    tone={
                      r.status === "verified"
                        ? "success"
                        : r.status === "disputed"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {r.status}
                  </Pill>
                ),
              },
            ]}
          />
        )}
      </div>
    </AppShell>
  );
}
