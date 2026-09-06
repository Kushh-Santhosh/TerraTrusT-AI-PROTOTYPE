import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Filter, Sparkles, Hash, User2, Navigation, FileBadge, Building2 } from "lucide-react";
import { properties } from "@/lib/mock-data";
import { Pill } from "@/components/ui-ext/Scaffold";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Smart search — TerraTrust AI" }] }),
  component: SearchPage,
});

const filters = ["All", "Residential", "Commercial", "Agricultural", "Verified", "Disputed", "Bengaluru", "Mysuru", "Pune", "Gurugram"];

type SearchMode = "auto" | "passport" | "gps" | "owner" | "survey" | "address";

const MODES: { id: SearchMode; label: string; icon: typeof Hash; hint: string }[] = [
  { id: "auto",     label: "Auto",      icon: Sparkles, hint: "AI detects intent" },
  { id: "passport", label: "Passport",  icon: FileBadge, hint: "e.g. TT-8421-KA" },
  { id: "gps",      label: "GPS",       icon: Navigation, hint: "lat, lng" },
  { id: "owner",    label: "Owner",     icon: User2, hint: "Full name" },
  { id: "survey",   label: "Survey #",  icon: Hash, hint: "e.g. KA/SUR/2024/8421" },
  { id: "address",  label: "Address",   icon: Building2, hint: "Street or locality" },
];

function detectMode(q: string): SearchMode {
  const t = q.trim();
  if (!t) return "auto";
  if (/^TT-?\d/i.test(t)) return "passport";
  if (/^[-+]?\d+\.\d+\s*,\s*[-+]?\d+\.\d+/.test(t)) return "gps";
  if (/^[A-Z]{2,4}\/\w+\/\d/i.test(t)) return "survey";
  if (/\d/.test(t) && /[A-Za-z]/.test(t)) return "address";
  if (/^[A-Z][a-z]+ [A-Z]/.test(t)) return "owner";
  return "auto";
}

function scoreMatch(p: typeof properties[number], q: string, mode: SearchMode): number {
  const lo = q.toLowerCase().trim();
  if (!lo) return 1;
  let s = 0;
  if (p.passportId.toLowerCase().includes(lo)) s += mode === "passport" ? 6 : 4;
  if (p.title.toLowerCase().includes(lo)) s += 3;
  if (p.address.toLowerCase().includes(lo)) s += mode === "address" ? 5 : 2;
  if (p.region.toLowerCase().includes(lo)) s += 1;
  if (p.owner.toLowerCase().includes(lo)) s += mode === "owner" ? 5 : 2;
  if (mode === "gps") {
    const m = lo.match(/^([-+]?\d+\.\d+)\s*,\s*([-+]?\d+\.\d+)/);
    if (m) {
      const dLat = Math.abs(p.coords.lat - parseFloat(m[1]));
      const dLng = Math.abs(p.coords.lng - parseFloat(m[2]));
      if (dLat < 0.05 && dLng < 0.05) s += 6 - (dLat + dLng) * 20;
    }
  }
  return s;
}

function SearchPage() {
  const [q, setQ] = useState("");
  const [f, setF] = useState("All");
  const [mode, setMode] = useState<SearchMode>("auto");

  const effectiveMode = mode === "auto" ? detectMode(q) : mode;
  const modeMeta = MODES.find(m => m.id === (mode === "auto" ? effectiveMode : mode)) ?? MODES[0];
  const ModeIcon = modeMeta.icon;

  const results = useMemo(() => {
    return properties
      .filter(p => {
        if (f === "All") return true;
        if (f === "Verified") return p.status === "verified";
        if (f === "Disputed") return p.status === "disputed";
        if (f === "Residential" || f === "Commercial" || f === "Agricultural") return p.type.toLowerCase() === f.toLowerCase();
        return p.region.toLowerCase() === f.toLowerCase();
      })
      .map(p => ({ property: p, score: scoreMatch(p, q, effectiveMode) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.property);
  }, [q, f, effectiveMode]);

  return (
    <AppShell title="Smart Search" subtitle="Find any property by passport ID, GPS coordinates, registered owner, survey number, or locality.">
      <div className="surface-card p-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              className="h-12 pl-10 pr-32 text-sm"
              placeholder="Try TT-8421-KA · 12.9567, 77.6200 · Ananya Sharma · KA/SUR/2024/8421"
            />
            <span className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary ring-1 ring-primary/20">
              <ModeIcon className="h-3 w-3" /> {modeMeta.label}
            </span>
          </div>
          <Button className="h-12"><Sparkles className="h-4 w-4 mr-1" /> Search Registry</Button>
          <Button variant="outline" className="h-12"><Filter className="h-4 w-4" /></Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {MODES.map(m => {
            const I = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ring-1 transition cursor-pointer ${mode === m.id ? "bg-foreground text-background ring-foreground" : "bg-surface text-muted-foreground ring-border hover:bg-muted"}`}
              >
                <I className="h-3 w-3" /> {m.label}
              </button>
            );
          })}
          <span className="ml-2 text-[11px] text-muted-foreground">{modeMeta.hint}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {filters.map(x => (
            <button key={x} onClick={() => setF(x)} className={`rounded-full px-3 py-1 text-xs ring-1 transition cursor-pointer ${f === x ? "bg-primary text-primary-foreground ring-primary" : "bg-surface text-muted-foreground ring-border hover:bg-muted"}`}>{x}</button>
          ))}
        </div>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Showing {results.length} matching parcels — {q.trim() ? "ranked by relevance" : "all records"} · mode <span className="font-semibold text-foreground">{modeMeta.label.toLowerCase()}</span>
      </p>

      <div className="mt-3 space-y-3">
        {results.map(p => (
          <Link key={p.id} to="/properties/$id" params={{ id: p.id }} className="surface-card flex items-center gap-4 p-4 hover:border-primary/40 transition">
            <div className="grid h-16 w-20 place-items-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 font-mono text-[10px] text-muted-foreground font-semibold">{p.passportId}</div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-sm text-foreground">{p.title}</p>
                <StatusBadge status={p.status} />
                <Pill tone="primary">Trust {p.trustScore}</Pill>
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {p.address} · {p.region}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Owner: {p.owner} · {p.coords.lat.toFixed(4)}° N, {p.coords.lng.toFixed(4)}° E</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">AI Valuation</p>
              <p className="font-display text-base font-bold text-foreground font-mono">₹{(p.valuation/10000000).toFixed(2)} Cr</p>
            </div>
          </Link>
        ))}
        {results.length === 0 && (
          <div className="surface-card p-10 text-center text-sm text-muted-foreground">
            No parcels matched. Try a different search mode or filter.
          </div>
        )}
      </div>
    </AppShell>
  );
}
