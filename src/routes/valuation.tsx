import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, TrendingUp, Info } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { valuationTrend } from "@/lib/mock-data";

export const Route = createFileRoute("/valuation")({
  head: () => ({ meta: [{ title: "AI Valuation — TerraTrust AI" }] }),
  component: ValuationPage,
});

function ValuationPage() {
  return (
    <AppShell title="AI Property Valuation" subtitle="Defensible, explainable Indian land values backed by sub-registrar comparables, satellite geography, and infrastructure signals.">
      {/* Valuation Notice */}
      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between">
        <span><strong className="text-foreground">AI VALUATION MODEL:</strong> Explainable AI model outputs based on registered circle rates and recent Indian registry comparables. Non-binding estimate; not an official legal government stamp valuation.</span>
        <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-[10px] text-primary font-bold">₹ INR ONLY</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="surface-card p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="font-semibold text-foreground">Estimate a Property</p>
          </div>
          <form className="mt-5 grid gap-4">
            <div className="grid gap-2">
              <Label>City / Region</Label>
              <Select defaultValue="bengaluru">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bengaluru">Bengaluru (Karnataka)</SelectItem>
                  <SelectItem value="mysuru">Mysuru (Karnataka)</SelectItem>
                  <SelectItem value="pune">Pune (Maharashtra)</SelectItem>
                  <SelectItem value="gurugram">Gurugram (NCR)</SelectItem>
                  <SelectItem value="hyderabad">Hyderabad (Telangana)</SelectItem>
                  <SelectItem value="mumbai">Mumbai (Maharashtra)</SelectItem>
                  <SelectItem value="delhi">Delhi (NCR)</SelectItem>
                  <SelectItem value="chennai">Chennai (Tamil Nadu)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Property type</Label>
              <Select defaultValue="residential">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="agricultural">Agricultural / Farmland</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>Area (m² / sq.ft)</Label><Input defaultValue="540 m²" /></div>
              <div className="grid gap-2"><Label>Year acquired</Label><Input defaultValue="2019" /></div>
            </div>
            <Button className="mt-2"><Sparkles className="h-4 w-4 mr-1" /> Run Valuation Engine</Button>
          </form>
        </div>

        <div className="grid gap-4">
          <div className="surface-card relative overflow-hidden p-6">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Point Estimate</p>
            <div className="mt-2 flex flex-wrap items-end gap-4">
              <p className="font-display text-5xl font-bold text-foreground">₹2,40,00,000</p>
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                <TrendingUp className="h-3 w-3" /> +9.2% YoY
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">95% confidence interval · ₹2.25 Cr – ₹2.55 Cr (₹44,444 / m²)</p>
            <div className="mt-6 h-44">
              <ResponsiveContainer>
                <AreaChart data={valuationTrend}>
                  <defs>
                    <linearGradient id="vp" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.45 0.08 195)" stopOpacity={0.45}/>
                      <stop offset="100%" stopColor="oklch(0.45 0.08 195)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.018 255)" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.018 255)" }} unit="L" />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="oklch(0.45 0.08 195)" strokeWidth={2} fill="url(#vp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-card p-6">
            <p className="font-semibold text-foreground text-sm">Value Attribution Breakdown</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                ["Local sub-registrar comparables", "+₹95 Lakhs", "From 28 nearby registered deeds in the last 24 months."],
                ["Infrastructure & transit access", "+₹38 Lakhs", "Metro connectivity, 60ft arterial road access, water grid."],
                ["Guideline value adjustments", "-₹10 Lakhs", "Annual state revision and zone setback tolerances."],
                ["Zoning & master plan overlay", "+₹18 Lakhs", "BMRDA/BBMP approved mixed-use residential zoning."],
              ].map(([t, v, d]) => (
                <div key={t} className="rounded-lg border border-border p-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">{t}</p>
                    <span className={`text-xs font-bold font-mono ${v.startsWith("-") ? "text-destructive" : "text-success"}`}>{v}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 text-primary" /> Every TerraTrust valuation ships with a complete algorithmic explainability ledger.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
