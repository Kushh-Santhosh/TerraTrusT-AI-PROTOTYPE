import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui-ext/StatCard";
import { Button } from "@/components/ui/button";
import { surveyorKpis, properties } from "@/lib/mock-data";
import { MapPin, Calendar, ChevronRight, Briefcase, Compass } from "lucide-react";

export const Route = createFileRoute("/surveyor")({
  head: () => ({ meta: [{ title: "Surveyor Workspace — TerraTrust AI" }] }),
  component: SurveyorPage,
});

const boundaryCaptures = [
  { id: "p_002", title: "Mysuru Farmland", points: 14, region: "Mysuru, Karnataka" },
  { id: "p_004", title: "Pune Mixed-use Plot", points: 8, region: "Pune, Maharashtra" },
  { id: "p_003", title: "Gurugram Commercial", points: 12, region: "Gurugram, Haryana" },
];

function SurveyorPage() {
  return (
    <AppShell
      title="Surveyor Workspace"
      subtitle="Cadastral field assignments, GIS polygon captures, and coordinate accuracy."
      requiredRole={["surveyor", "admin"]}
      actions={
        <div className="flex items-center gap-2">
          <Link to="/surveyor/tools">
            <Button variant="outline" className="rounded-full">
              <Compass className="h-4 w-4 mr-1 text-primary" /> GIS Tools
            </Button>
          </Link>
          <Link to="/surveyor/assignments">
            <Button className="rounded-full">
              <Briefcase className="h-4 w-4 mr-1" /> View Assignments
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {surveyorKpis.map(k => <StatCard key={k.label} kpi={k} />)}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-foreground">Upcoming Field Work</p>
            <Link to="/surveyor/assignments" className="text-xs text-primary hover:underline">
              All assignments
            </Link>
          </div>
          <ul className="mt-2 divide-y divide-border">
            {properties.slice(0, 3).map((p, i) => (
              <li key={p.id} className="py-2">
                <Link
                  to="/properties/$id"
                  params={{ id: p.id }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition group"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition">{p.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <MapPin className="h-3 w-3 text-primary" />{p.region} · <Calendar className="h-3 w-3" /> Scheduled in {i + 1} day{i ? "s" : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-foreground">Boundary Captures Awaiting Review</p>
            <Link to="/surveyor/tools" className="text-xs text-primary hover:underline">
              Boundary tools
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {boundaryCaptures.map(x => (
              <li key={x.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:border-primary/40 transition">
                <div>
                  <p className="font-medium text-foreground">{x.title}</p>
                  <p className="text-xs text-muted-foreground">{x.points} GPS polygon vertices · {x.region}</p>
                </div>
                <Link to="/properties/$id/boundary" params={{ id: x.id }}>
                  <Button size="sm" variant="outline" className="text-xs">
                    Inspect
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
