import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, DataTable, Pill } from "@/components/ui-ext/Scaffold";
import { PropertySubNav } from "@/components/property/PropertySubNav";

export const Route = createFileRoute("/properties/$id/ownership")({
  head: () => ({ meta: [{ title: "Ownership History — TerraTrust AI" }] }),
  component: Page,
});

const rows = [
  {
    from: "2019-06-14",
    to: "Present",
    owner: "Ananya Sharma",
    method: "Registered Sale Deed",
    price: "₹2.15 Cr",
    source: "Bengaluru Urban Sub-Registrar",
  },
  {
    from: "2009-04-22",
    to: "2019-06-14",
    owner: "S. Murthy",
    method: "Family Partition Deed",
    price: "—",
    source: "Karnataka Civil Court Records",
  },
  {
    from: "1994-11-08",
    to: "2009-04-22",
    owner: "M. Murthy",
    method: "Allotment Sale",
    price: "₹18,00,000",
    source: "Bangalore Development Authority (BDA)",
  },
  {
    from: "1982-01-15",
    to: "1994-11-08",
    owner: "Government of Karnataka",
    method: "Revenue Grant Allotment",
    price: "—",
    source: "Karnataka State Gazette",
  },
];

function Page() {
  const { id } = Route.useParams();
  return (
    <AppShell
      title="Ownership History"
      subtitle="Verified evidentiary chain of title and transfer records."
    >
      <Crumbs
        items={[
          { label: "Properties", to: "/properties" },
          { label: id, to: "/properties/$id" },
          { label: "Ownership" },
        ]}
      />
      <PropertySubNav propertyId={id} activeTab="ownership" />

      <div className="mb-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">OFFICIAL TITLE CHAIN:</strong> Traceable title sequence
        linked to sub-registrar deed numbers and Encumbrance Certificates (Form 15/16).
      </div>

      <DataTable
        rows={rows}
        columns={[
          { key: "from", label: "From", render: (r) => r.from },
          { key: "to", label: "To", render: (r) => r.to },
          {
            key: "owner",
            label: "Owner",
            render: (r) => <span className="font-medium text-foreground">{r.owner}</span>,
          },
          { key: "method", label: "Method", render: (r) => <Pill tone="info">{r.method}</Pill> },
          {
            key: "price",
            label: "Recorded Value",
            render: (r) => <span className="font-mono text-muted-foreground">{r.price}</span>,
          },
          {
            key: "source",
            label: "Registry Source",
            render: (r) => <span className="text-muted-foreground">{r.source}</span>,
          },
        ]}
      />
    </AppShell>
  );
}
