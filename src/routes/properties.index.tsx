import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadBankEligibleProperties, loadOwnedProperties } from "@/lib/property-repository";
import { normalizeRole, useAuth } from "@/lib/auth";
import { Filter, Grid3x3, List, Plus, Search, MapPin, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Property } from "@/lib/types";
import { PropertyCardMiniMap } from "@/components/property/PropertyCardMiniMap";

export const Route = createFileRoute("/properties/")({
  head: () => ({ meta: [{ title: "Properties Portfolio — TerraTrust AI" }] }),
  component: PropertiesPage,
});

function formatInr(val: number): string {
  if (!val) return "₹0";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} Lakh`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function PropertiesPage() {
  const { user, profile } = useAuth();
  const isBank = normalizeRole(profile?.role ?? user?.user_metadata?.role) === "bank";
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [propertiesList, setPropertiesList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      (isBank ? loadBankEligibleProperties() : loadOwnedProperties(user.id)).then((data) => {
        setPropertiesList(data);
        setLoading(false);
      });
    } else {
      setPropertiesList([]);
      setLoading(false);
    }
  }, [user?.id, isBank]);

  const filteredProperties = propertiesList.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.passportId.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.region.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell
      title="Properties"
      subtitle="Your Property Passports across Indian states, urban parcels, and agricultural holdings."
      actions={
        !isBank ? (
          <Link to="/properties/new">
            <Button className="rounded-full gap-1.5">
              <Plus className="h-4 w-4" /> Register Property
            </Button>
          </Link>
        ) : undefined
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            placeholder="Search by title, passport ID, city, or address…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-10">
          <Filter className="h-4 w-4" /> Filter
        </Button>
        <div className="ml-auto flex rounded-md border border-border bg-surface p-1">
          <button
            onClick={() => setView("grid")}
            className={cn("rounded p-1.5", view === "grid" ? "bg-muted" : "text-muted-foreground")}
            aria-label="Grid view"
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn("rounded p-1.5", view === "list" ? "bg-muted" : "text-muted-foreground")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="surface-card p-12 text-center text-sm text-muted-foreground">
          Loading your persisted properties...
        </div>
      ) : filteredProperties.length === 0 ? (
        /* Empty State */
        <div className="surface-card flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary mb-4">
            <Building2 className="h-8 w-8" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground">
            No properties registered yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            You haven't registered any land parcels or property passports yet. Register your first
            parcel to establish GIS boundary and AI verification.
          </p>
          <div className="mt-6">
            <Link to="/properties/new">
              <Button className="rounded-full gap-2 px-6">
                <Plus className="h-4 w-4" /> Register Property
              </Button>
            </Link>
          </div>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProperties.map((p) => (
            <Link
              key={p.id}
              to="/properties/$id"
              params={{ id: p.id }}
              className="surface-card group overflow-hidden transition hover:shadow-[var(--shadow-elev)]"
            >
              <div className="relative h-36 overflow-hidden">
                <PropertyCardMiniMap coords={p.coords} boundary={p.boundary} title={p.title} />
                <div className="absolute right-3 top-3 z-20">
                  <StatusBadge status={p.status} />
                </div>
              </div>
              <div className="p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {p.passportId}
                </p>
                <p className="mt-1 font-medium text-foreground group-hover:text-primary truncate">
                  {p.title}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {p.region}, {p.country}
                </p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      AI valuation
                    </p>
                    <p className="font-display text-lg font-bold text-foreground">
                      {formatInr(p.valuation)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Trust
                    </p>
                    <p
                      className={`font-display text-xl font-bold ${
                        p.trustScore >= 85
                          ? "text-success"
                          : p.trustScore >= 65
                            ? "text-primary"
                            : p.trustScore >= 45
                              ? "text-warning"
                              : "text-destructive"
                      }`}
                    >
                      {p.trustScore}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Passport</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Trust</th>
                <th className="px-4 py-3 font-medium text-right">Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProperties.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3">
                    <Link
                      to="/properties/$id"
                      params={{ id: p.id }}
                      className="font-medium hover:text-primary transition"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{p.address}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-primary font-medium">
                    {p.passportId}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{p.type}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 font-semibold">{p.trustScore}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatInr(p.valuation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
