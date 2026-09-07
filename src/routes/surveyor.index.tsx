import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui-ext/StatCard";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, ChevronRight, Briefcase, Compass } from "lucide-react";
import { loadSurveyorAssignments } from "@/lib/property-repository";
import type { Property } from "@/lib/types";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/surveyor/")({
  head: () => ({ meta: [{ title: "Surveyor Workspace — TerraTrust AI" }] }),
  component: SurveyorPage,
});

function SurveyorPage() {
  const [assignments, setAssignments] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    loadSurveyorAssignments(user.id).then((props) => {
      setAssignments(props);
      setLoading(false);
    });
  }, [user?.id]);

  const surveyorKpis = [
    {
      label: "Active Field Assignments",
      value: `${assignments.length}`,
      delta: "+1",
      trend: "up" as const,
      hint: "Parcels pending field survey",
    },
    {
      label: "GPS Boundaries Captured",
      value: `${assignments.filter((p) => p.boundary?.length).length}`,
      hint: "Persisted citizen boundaries",
    },
    {
      label: "Submitted Surveys",
      value: `${assignments.filter((p) => (p as any).assignmentStatus === "submitted").length}`,
      hint: "Persisted field submissions",
    },
    {
      label: "Open Field Issues",
      value: `${assignments.filter((p) => p.surveyorDecision === "correction_required").length}`,
      hint: "Boundary discrepancies",
    },
  ];

  const boundaryCaptures = assignments.slice(0, 3).map((p) => ({
    id: p.id,
    title: p.title,
    points: p.boundary?.length || 8,
    region: `${p.region}, ${p.country}`,
  }));

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
        {surveyorKpis.map((k) => (
          <StatCard key={k.label} kpi={k} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-foreground">Upcoming Field Work</p>
            <Link to="/surveyor/assignments" className="text-xs text-primary hover:underline">
              All assignments
            </Link>
          </div>
          {loading ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Loading assigned parcels…
            </p>
          ) : assignments.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="font-medium text-foreground">No assignments yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                When government registry queues dispatch new field verification requests, they will
                appear here.
              </p>
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {assignments.slice(0, 4).map((p, i) => (
                <li key={p.id} className="py-2">
                  <Link
                    to="/properties/$id"
                    params={{ id: p.id }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition group"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition">
                        {p.title}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <MapPin className="h-3 w-3 text-primary" />
                        {p.region} · <Calendar className="h-3 w-3" />{" "}
                        {String((p as any).assignmentStatus || "assigned")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-foreground">Boundary Captures Awaiting Review</p>
            <Link to="/surveyor/tools" className="text-xs text-primary hover:underline">
              Boundary tools
            </Link>
          </div>
          {boundaryCaptures.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No pending boundary inspections.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {boundaryCaptures.map((x) => (
                <li
                  key={x.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:border-primary/40 transition"
                >
                  <div>
                    <p className="font-medium text-foreground">{x.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {x.points} GPS polygon vertices · {x.region}
                    </p>
                  </div>
                  <Link to="/properties/$id/boundary" params={{ id: x.id }}>
                    <Button size="sm" variant="outline" className="text-xs">
                      Inspect
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
