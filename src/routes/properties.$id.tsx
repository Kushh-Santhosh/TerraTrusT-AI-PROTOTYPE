import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { PropertyDocument, VerificationEvent } from "@/lib/types";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { TrustScore } from "@/components/ui-ext/TrustScore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { properties, valuationTrend } from "@/lib/mock-data";
import { RealMap } from "@/components/ui-ext/RealMap";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Download, FileText, History, MapPinned, MapPin, QrCode, Share2, ShieldCheck, Sparkles, Users2, CheckCircle2, AlertTriangle, Workflow } from "lucide-react";
import { computeConfidence } from "@/lib/confidence-engine";
import { getEncumbrances, getNearbyInfra, getRiskIndicators, getOwnershipHistory } from "@/lib/property-intel";
import { getFraudReport } from "@/lib/fraud-engine";
import { ConfidenceBreakdown } from "@/components/ui-ext/ConfidenceBreakdown";
import { EncumbrancePanel, NearbyInfraPanel, RiskIndicatorsPanel, OwnershipHistoryPanel } from "@/components/ui-ext/IntelPanels";
import { loadPropertyById } from "@/lib/property-repository";
import { PropertySubNav } from "@/components/property/PropertySubNav";
import { PassportQRCode } from "@/components/property/PassportQRCode";
import type { Property } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { deleteOwnedProperty } from "@/lib/supabase-persistence";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/properties/$id")({
  head: ({ params }) => ({ meta: [{ title: `Property ${params.id} — TerraTrust AI` }] }),
  notFoundComponent: () => (
    <AppShell title="Property not found"><p className="text-muted-foreground">We couldn't find that passport. <Link to="/properties" className="text-primary">Back to properties</Link>.</p></AppShell>
  ),
  component: PassportPage,
});

function PassportPage() {
  const { id } = Route.useParams();
  const [p, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = Route.useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });
  useEffect(() => {
    let active = true;
    setLoading(true);
    setProperty(null);
    loadPropertyById(id).then((property) => {
      if (!active) return;
      setProperty(property);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (pathname !== `/properties/${id}`) return <Outlet />;
  if (loading) {
    return (
      <AppShell title="Loading property...">
        <p className="text-muted-foreground">Loading the persisted property record.</p>
      </AppShell>
    );
  }
  if (!p) {
    return (
      <AppShell title="Property not found">
        <p className="text-muted-foreground">
          We couldn't find that passport. <Link to="/properties" className="text-primary">Back to properties</Link>.
        </p>
      </AppShell>
    );
  }
  const confidence = computeConfidence(p);
  const encs = getEncumbrances(p);
  const infra = getNearbyInfra(p);
  const risks = getRiskIndicators(p);
  const history = getOwnershipHistory(p);
  const fraud = getFraudReport(p);
  const isOwner = Boolean(user?.id && p.ownerId === user.id);

  async function handleDelete() {
    if (!p || !user?.id || deleteText !== p.passportId) return;
    setDeleting(true);
    const result = await deleteOwnedProperty({
      propertyId: p.id,
      passportId: p.passportId,
      ownerId: user.id,
      storagePaths: p.documents.map((document) => document.storagePath),
    });
    setDeleting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setDeleteOpen(false);
    toast.success("Property deleted successfully.");
    await navigate({ to: "/properties" });
  }
  return (
    <AppShell
      title={p.title}
      subtitle={`${p.address} · ${p.region}, ${p.country}`}
      actions={
        <>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/properties/$id/share" params={{ id: p.id }}><Share2 className="h-4 w-4" /> Share</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/properties/$id/passport-pdf" params={{ id: p.id }}><Download className="h-4 w-4" /> Export PDF</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/properties/$id/passport-pdf" params={{ id: p.id }}><QrCode className="h-4 w-4" /> Passport QR</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/properties/$id/verify" params={{ id: p.id }}><Workflow className="h-4 w-4" /> Run Live Verification</Link>
          </Button>
        </>
      }>

      {/* Passport header */}
      <div className="surface-card overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Evidence / Trust Summary</span>
              <span>· <span className="font-mono">{p.passportId}</span></span>
              <StatusBadge status={p.status} />
            </div>
            <h2 className="font-display mt-3 text-4xl">{p.title}</h2>
            <p className="text-sm text-muted-foreground">{p.address}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <KV k="AI valuation" v={`₹${p.valuation.toLocaleString("en-IN")}`} tone="primary" />
              <KV k="Area" v={`${p.area.toLocaleString()} m²`} />
              <KV k="Type" v={p.type} />
              <KV k="Owned since" v={new Date(p.ownerSince).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} />
            </div>
          </div>
          <div className="flex flex-col items-center border-t border-border pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <TrustScore value={confidence.score} size={140} />
            <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{confidence.band} · AI conf. {p.aiConfidence}%</p>
            {fraud.riskScore >= 20 && (
              <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] ring-1 ${fraud.band === "Critical" ? "bg-destructive/10 text-destructive ring-destructive/20" : fraud.band === "Elevated" ? "bg-warning/15 text-warning-foreground ring-warning/30" : "bg-muted text-muted-foreground ring-border"}`}>
                <AlertTriangle className="h-3 w-3" /> Fraud: {fraud.band}
              </span>
            )}
          </div>
        </div>
      </div>

      <PassportQRCode property={p} />

      {isOwner && (
        <div className="flex justify-end">
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete Property
          </Button>
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this property?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the property record, uploaded documents, verification results, review cases, AI analyses, and associated passport reference from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label htmlFor="delete-passport-id" className="text-sm font-medium">Type the Passport ID to confirm</label>
            <Input id="delete-passport-id" value={deleteText} onChange={(event) => setDeleteText(event.target.value)} placeholder={p.passportId} className="font-mono" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteText("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteText !== p.passportId || deleting}
              onClick={(event) => { event.preventDefault(); void handleDelete(); }}
            >
              {deleting ? "Deleting..." : "Delete Property"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Property Sub-Routes Toolbar */}
      <PropertySubNav propertyId={p.id} activeTab="overview" />

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="bg-muted/60 flex-wrap h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="confidence">Confidence</TabsTrigger>
              <TabsTrigger value="intel">Intel</TabsTrigger>
              <TabsTrigger value="history">Ownership</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="boundary">GIS</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 grid gap-4">
              <div className="surface-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <p className="font-medium">Cadastral Map & Boundary</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    ({p.coords?.lat?.toFixed(5) || "12.9716"}, {p.coords?.lng?.toFixed(5) || "77.5946"}) · {p.area.toLocaleString()} m²
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-border">
                  <RealMap
                    key={p.id}
                    initialCenter={p.coords || { lat: 12.9716, lng: 77.5946 }}
                    boundary={p.boundary || []}
                    secondaryBoundary={p.surveyorBoundary || undefined}
                    secondaryBoundaryLabel="OFFICIAL SURVEYOR BOUNDARY"
                    boundaryLabel={`CADASTRAL RECORD (${p.passportId})`}
                    readOnly={true}
                    height={340}
                  />
                </div>
              </div>

              <div className="surface-card p-5">
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><p className="font-medium">AI valuation history</p></div>
                <div className="mt-3 h-56">
                  <ResponsiveContainer>
                    <AreaChart data={valuationTrend}>
                      <defs><linearGradient id="vv" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.78 0.13 75)" stopOpacity={0.5}/>
                        <stop offset="100%" stopColor="oklch(0.78 0.13 75)" stopOpacity={0}/>
                      </linearGradient></defs>
                      <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.018 255)" }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.018 255)" }} unit="k" />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid oklch(0.92 0.008 250)" }} />
                      <Area type="monotone" dataKey="value" stroke="oklch(0.78 0.13 75)" strokeWidth={2} fill="url(#vv)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <RiskIndicatorsPanel items={risks} />
            </TabsContent>

            <TabsContent value="confidence" className="mt-4">
              <ConfidenceBreakdown report={confidence} />
            </TabsContent>

            <TabsContent value="intel" className="mt-4 grid gap-4">
              <EncumbrancePanel items={encs} />
              <NearbyInfraPanel items={infra} />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <OwnershipHistoryPanel items={history} />
            </TabsContent>


            <TabsContent value="documents" className="mt-4">
              <div className="surface-card divide-y divide-border">
                {p.documents.map((d: PropertyDocument) => (
                  <div key={d.id} className="flex items-center gap-4 p-4">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{d.kind} · Uploaded {d.uploadedAt}</p>
                    </div>
                    {d.verified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Verified</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-warning"><AlertTriangle className="h-3.5 w-3.5" /> Pending</span>
                    )}
                    <Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
                <button className="flex w-full items-center justify-center gap-2 p-4 text-sm text-primary hover:bg-muted/30">
                  + Upload document
                </button>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <ol className="relative ml-3 border-l border-border">
                {p.timeline.map((e: VerificationEvent) => (
                  <li key={e.id} className="mb-6 pl-6">
                    <span className="absolute -left-2.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"><History className="h-3 w-3" /></span>
                    <p className="text-sm font-medium">{e.action}</p>
                    <p className="text-xs text-muted-foreground">{e.actor} · <span className="capitalize">{e.role}</span> · {e.at}</p>
                  </li>
                ))}
              </ol>
            </TabsContent>

            <TabsContent value="boundary" className="mt-4">
              <div className="overflow-hidden rounded-xl border border-border">
                <RealMap
                  key={`boundary-${p.id}`}
                  initialCenter={p.coords || { lat: 12.9716, lng: 77.5946 }}
                  boundary={p.boundary || []}
                  secondaryBoundary={p.surveyorBoundary || undefined}
                  secondaryBoundaryLabel="SURVEYOR OBSERVED BOUNDARY"
                  boundaryLabel={`SUBMITTED GEOMETRY (${p.passportId})`}
                  readOnly={true}
                  height={420}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="surface-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Owner of record</p>
            <p className="mt-1 font-display text-2xl">{p.owner}</p>
            <p className="text-xs text-muted-foreground">Verified citizen · ID confirmed</p>
            <div className="mt-4 grid gap-2 text-sm">
              <Stat icon={MapPinned} t={`${p.region}, ${p.country}`} />
              <Stat icon={Users2} t="Community attestations: 8" />
              <Stat icon={ShieldCheck} t="Last verified 12 days ago" />
            </div>
          </div>
          <div className="surface-card p-5">
            <p className="font-medium">Tags</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(p.tags ?? []).map((t: string) => <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs">{t}</span>)}
            </div>
          </div>
          <div className="surface-card p-5">
            <p className="font-medium">Share this passport</p>
            <p className="mt-1 text-xs text-muted-foreground">Banks and buyers can verify ownership and trust with a single link.</p>
            <div className="mt-3 flex gap-2">
              <input readOnly value={`terratrust.ai/p/${p.passportId}`} className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-xs" />
              <Button size="sm">Copy</Button>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function KV({ k, v, tone }: { k: string; v: string; tone?: "primary" }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</p>
      <p className={`mt-1 text-sm font-medium capitalize ${tone === "primary" ? "text-primary" : ""}`}>{v}</p>
    </div>
  );
}
function Stat({ icon: Icon, t }: { icon: any; t: string }) {
  return <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-3.5 w-3.5" /><span>{t}</span></div>;
}
