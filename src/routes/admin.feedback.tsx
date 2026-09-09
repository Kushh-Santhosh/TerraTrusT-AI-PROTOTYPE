import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { KpiRow, Pill } from "@/components/ui-ext/Scaffold";
import { Star } from "lucide-react";

export const Route = createFileRoute("/admin/feedback")({
  head: () => ({ meta: [{ title: "Feedback — Admin" }] }),
  component: Page,
});

const items = [
  {
    name: "Vikram S.",
    role: "Citizen",
    rating: 5,
    text: "The Property Passport got my Indiranagar property verified in 4 days. Wild.",
    at: "2024-09-23",
  },
  {
    name: "Arjun M.",
    role: "Surveyor",
    rating: 4,
    text: "The mobile GeoJSON boundary tool is fast, especially on Karnataka village parcels.",
    at: "2024-09-22",
  },
  {
    name: "Dr. Vandana Rao",
    role: "Officer",
    rating: 5,
    text: "Cadastral review queue cut our revenue backlog by 60% this quarter.",
    at: "2024-09-20",
  },
  {
    name: "Ananya S.",
    role: "Citizen",
    rating: 4,
    text: "Trust score breakdown with n8n and GIS evidence is extremely clear.",
    at: "2024-09-19",
  },
];

function Page() {
  return (
    <AppShell title="User feedback" subtitle="What the field is saying." requiredRole="admin">
      <KpiRow
        items={[
          { label: "NPS", value: "62", hint: "+8 vs last quarter" },
          { label: "Avg. rating", value: "4.6 / 5" },
          { label: "Responses (30d)", value: "8,412" },
          { label: "Action items open", value: "23" },
        ]}
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((f, i) => (
          <div key={i} className="surface-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{f.name}</p>
                <Pill tone="info">{f.role}</Pill>
              </div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-4 w-4 ${j < f.rating ? "fill-warning text-warning-foreground" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">"{f.text}"</p>
            <p className="mt-2 text-[11px] text-muted-foreground">{f.at}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
