import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { AIBadge, AIInsightCard, ExplainabilityPanel, ConfidenceMeter, ReasoningTrace } from "@/components/ai/AIPrimitives";
import { SectionTitle, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, TrendingUp, MapPin, Building2 } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { valuationHistory, valuationFactors } from "@/lib/ai-mock";

export const Route = createFileRoute("/ai-valuation")({
  head: () => ({ meta: [{ title: "AI Valuation Engine — TerraTrust AI" }] }),
  component: ValuationEnginePage,
});

const comps = [
  { id: "C-1", addr: "100ft Road, Indiranagar", area: 510, price: 2.35, dist: 0.2 },
  { id: "C-2", addr: "4th Block, Koramangala", area: 560, price: 2.62, dist: 0.4 },
  { id: "C-3", addr: "Sector 1, HSR Layout", area: 495, price: 2.18, dist: 0.6 },
  { id: "C-4", addr: "Outer Ring Road, Marathahalli", area: 600, price: 2.80, dist: 0.7 },
  { id: "C-5", addr: "Banerghatta Main Rd", area: 530, price: 2.40, dist: 0.9 },
];

function ValuationEnginePage() {
  return (
    <AppShell
      title="AI Valuation Engine"
      subtitle="Defensible, explainable Indian land values backed by sub-registrar deeds, spatial indicators, and macro signals."
      actions={<AIBadge tone="accent">Model Indic v2.4 · Calibrated weekly</AIBadge>}
    >
      {/* Prototype / Estimate Notice */}
      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between">
        <span><strong className="text-foreground">PROTOTYPE VALUATION ENGINE:</strong> Machine learning valuation based on registered circle rates, sub-registrar transaction datasets, and infrastructure corridors. Non-binding estimate; not an official government legal title valuation.</span>
        <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-[10px] text-primary font-bold">₹ INR ONLY</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="surface-card p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="font-semibold text-foreground">Estimate a Parcel</p>
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
              <Label>Land Use</Label>
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
              <div className="grid gap-2"><Label>Area (m²)</Label><Input defaultValue="540" /></div>
              <div className="grid gap-2"><Label>Year acquired</Label><Input defaultValue="2019" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>Frontage (m)</Label><Input defaultValue="18" /></div>
              <div className="grid gap-2"><Label>Setback (m)</Label><Input defaultValue="4.5" /></div>
            </div>
            <Button className="mt-2"><Sparkles className="h-4 w-4 mr-1" /> Run AI Valuation</Button>
          </form>

          <div className="mt-6 space-y-3">
            <ConfidenceMeter value={92} label="Model certainty" hint="Tight comp-set · verified deed registry" />
            <ConfidenceMeter value={86} label="Comparable density" hint="5 sub-registrar comps within 1km" />
            <ConfidenceMeter value={88} label="Macro stability" hint="State guidance value stable" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <AIInsightCard icon={<TrendingUp className="h-3 w-3 text-success" />} title="Point estimate" value="₹2.45 Cr" delta={{ value: 8.4, label: "YoY" }} tone="success" />
            <AIInsightCard icon={<Building2 className="h-3 w-3 text-primary" />} title="Range" value="₹2.30 Cr – ₹2.60 Cr" hint="80% confidence interval" tone="primary" />
            <AIInsightCard icon={<MapPin className="h-3 w-3 text-primary" />} title="Price / m²" value="₹45,370" hint="vs. corridor median ₹42,800" tone="accent" />
          </div>

          <div className="surface-card p-6">
            <SectionTitle eyebrow="12 months" title="AI valuation history" description="Reconstructed point estimate with weekly recalibration across registered sales." />
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={valuationHistory}>
                  <defs>
                    <linearGradient id="vh" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.55 0.1 180)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="oklch(0.55 0.1 180)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
                  <XAxis dataKey="m" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs" unit="L" />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="oklch(0.45 0.08 195)" fill="url(#vh)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ExplainabilityPanel title="Factor attribution" factors={valuationFactors} />
            <div className="surface-card p-5">
              <SectionTitle eyebrow="Comparables" title="5 nearby sales · last 90 days" />
              <div className="h-48 mt-2">
                <ResponsiveContainer>
                  <BarChart data={comps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
                    <XAxis dataKey="id" tickLine={false} axisLine={false} className="text-xs" />
                    <YAxis tickLine={false} axisLine={false} className="text-xs" unit="Cr" />
                    <Tooltip />
                    <Bar dataKey="price" fill="oklch(0.55 0.1 180)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {comps.map(c => (
                  <li key={c.id} className="flex items-center justify-between rounded-lg bg-surface p-2.5 ring-1 ring-border">
                    <span className="flex items-center gap-2 text-foreground font-medium text-xs"><Pill>{c.id}</Pill> {c.addr}</span>
                    <span className="text-muted-foreground text-xs">{c.area} m² · ₹{c.price} Cr · {c.dist}km</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="surface-card p-5">
            <SectionTitle eyebrow="Reasoning" title="How the engine arrived at ₹2.45 Cr" />
            <ReasoningTrace steps={[
              { label: "Pull comparable sales", detail: "12 candidates → 5 retained after recency, type & distance filters in Bengaluru Urban." },
              { label: "Geographic adjustment", detail: "Indiranagar / Koramangala corridor premium: +18% over district median." },
              { label: "Document trust adjustment", detail: "+3% for verified Registered Sale Deed and Bhoomi survey record match." },
              { label: "Guideline value alignment", detail: "Calibrated against Karnataka Revenue Department 2024 revised circle rates." },
              { label: "Calibration", detail: "Model RMSE 3.8% on holdout transactions. Final point estimate: ₹2.45 Cr ± ₹12 Lakhs." },
            ]} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
