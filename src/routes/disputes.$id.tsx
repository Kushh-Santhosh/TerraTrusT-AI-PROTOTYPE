import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { MessageSquare, Paperclip } from "lucide-react";

export const Route = createFileRoute("/disputes/$id")({
  head: () => ({ meta: [{ title: "Dispute — TerraTrust AI" }] }),
  component: Page,
});

const events = [
  {
    at: "2024-09-25",
    actor: "Revenue Mediator J. Rao",
    text: "Lok Adalat hearing scheduled for 2024-10-08 at the District Collectorate.",
  },
  {
    at: "2024-09-20",
    actor: "Priya Reddy",
    text: "Submitted original Registered Sale Deed and 2021 cadastral survey naksha as evidence.",
  },
  {
    at: "2024-09-15",
    actor: "Counter-party Rajesh Verma",
    text: "Claims rightful title based on a 2023 agreement to sell. Evidentiary documents under OCR review.",
  },
  {
    at: "2024-07-30",
    actor: "TerraTrust AI",
    text: "Boundary overlap detected via GIS spatial intersection — case auto-escalated.",
  },
];

function Page() {
  const { id } = Route.useParams();
  return (
    <AppShell
      title="Overlapping Ownership Dispute"
      subtitle={`${id} · Filed 2024-07-30 · Status: Mediation Queue`}
      actions={
        <>
          <Button variant="outline">
            <Paperclip className="h-4 w-4 mr-1" /> Add Evidence
          </Button>
          <Button>
            <MessageSquare className="h-4 w-4 mr-1" /> Reply to Notice
          </Button>
        </>
      }
    >
      <Crumbs items={[{ label: "Disputes", to: "/disputes" }, { label: id }]} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-6 lg:col-span-2">
          <h3 className="font-display text-xl font-semibold text-foreground">
            Dispute Case Docket
          </h3>
          <ol className="mt-4 space-y-4">
            {events.map((e, i) => (
              <li key={i} className="relative pl-6">
                <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary" />
                <p className="text-xs text-muted-foreground">{e.at}</p>
                <p className="text-sm text-foreground mt-0.5">
                  <span className="font-semibold">{e.actor}</span> — {e.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-3">
          <div className="surface-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Disputed Parcel
            </p>
            <Link
              to="/properties/$id"
              params={{ id: "p_003" }}
              className="mt-1 block font-semibold hover:text-primary text-sm text-foreground"
            >
              Gurugram Commercial Plot
            </Link>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recorded Parties
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-foreground">
              <li className="flex items-center justify-between">
                <span>Priya Reddy</span> <Pill tone="primary">Claimant</Pill>
              </li>
              <li className="flex items-center justify-between">
                <span>Rajesh Verma</span> <Pill tone="warning">Counter-party</Pill>
              </li>
              <li className="flex items-center justify-between">
                <span>District Revenue Office</span> <Pill tone="info">Mediator</Pill>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
