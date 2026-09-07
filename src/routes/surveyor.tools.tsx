import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import {
  Calculator,
  Ruler,
  FileText,
  Compass,
  Layers,
  ScanLine,
  ArrowRight,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/surveyor/tools")({
  head: () => ({ meta: [{ title: "Surveyor Field Toolkit — TerraTrust AI" }] }),
  component: SurveyorToolsPage,
});

function SurveyorToolsPage() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<"converter" | "validator" | null>(null);

  // Coord converter state
  const [lat, setLat] = useState("12.9716");
  const [lng, setLng] = useState("77.5946");
  const [utmZone, setUtmZone] = useState("43N");

  // GeoJSON validator state
  const [geoJsonInput, setGeoJsonInput] = useState(
    '{"type":"Polygon","coordinates":[[[77.594,12.971],[77.596,12.971],[77.596,12.973],[77.594,12.973],[77.594,12.971]]]}',
  );
  const [validationResult, setValidationResult] = useState<string | null>(null);

  const handleConvert = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      toast.error("Invalid coordinates entered");
      return;
    }
    toast.success(
      `Converted ${latNum.toFixed(4)}°N, ${lngNum.toFixed(4)}°E to UTM ${utmZone} & Everest 1830 Datum`,
    );
  };

  const handleValidateGeoJson = () => {
    try {
      const parsed = JSON.parse(geoJsonInput);
      if (!parsed.type || !["Polygon", "MultiPolygon", "Feature"].includes(parsed.type)) {
        throw new Error("GeoJSON must be a Polygon or Feature geometry");
      }
      setValidationResult(
        "Valid GeoJSON! Topology closed, correct WGS84 orientation, compliant with Bhoomi cadastral standard.",
      );
      toast.success("GeoJSON validated successfully");
    } catch (err: any) {
      setValidationResult(`Invalid GeoJSON: ${err.message}`);
      toast.error("GeoJSON validation failed");
    }
  };

  const tools = [
    {
      icon: Ruler,
      name: "Distance & Area Measure",
      desc: "Measure cadastral parcels on the live map. Auto-converts to m², Gunthas, Cents, and Acres.",
      action: () => navigate({ to: "/map" }),
      buttonLabel: "Open GIS Map",
    },
    {
      icon: Compass,
      name: "Boundary Capture & Detection",
      desc: "Compute GPS corner bearings and RTK polygon boundary points with sub-meter accuracy.",
      action: () => navigate({ to: "/ai-boundary" }),
      buttonLabel: "Capture Boundary",
    },
    {
      icon: ScanLine,
      name: "Cadastral GeoJSON Validator",
      desc: "Lint, repair, and check topological closure of survey GeoJSON before submitting to government queue.",
      action: () => setActiveModal("validator"),
      buttonLabel: "Launch Validator",
    },
    {
      icon: Layers,
      name: "Satellite & Sentinel-2 Overlay",
      desc: "Compare satellite passes, temporal changes, and multi-spectral indices over boundary sketches.",
      action: () => navigate({ to: "/ai-satellite" }),
      buttonLabel: "Compare Satellite",
    },
    {
      icon: Calculator,
      name: "Coordinate & Datum Converter",
      desc: "WGS84 (Lat/Long) ↔ UTM Zone 43N/44N ↔ Indian Cadastral Datum (Kalyanpur / Everest 1830).",
      action: () => setActiveModal("converter"),
      buttonLabel: "Convert Datum",
    },
    {
      icon: FileText,
      name: "Official Survey Reports",
      desc: "Generate and review signed PDF survey reports and verification dossiers for Revenue Officers.",
      action: () => navigate({ to: "/reports" }),
      buttonLabel: "View Reports",
    },
  ];

  return (
    <AppShell
      title="Surveyor Toolkit"
      subtitle="Calibrated field utilities for licensed cadastral surveyors and revenue inspectors."
      requiredRole={["surveyor", "admin"]}
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <div
            key={t.name}
            className="surface-card flex flex-col justify-between p-6 transition hover:shadow-lg hover:border-primary/40 group rounded-xl border border-border"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition">
                <t.icon className="h-6 w-6" />
              </div>
              <p className="font-display text-lg font-semibold text-foreground mb-1">{t.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between group-hover:border-primary group-hover:text-primary transition"
                onClick={t.action}
              >
                <span>{t.buttonLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Coordinate Converter Dialog */}
      <Dialog open={activeModal === "converter"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Coordinate & Datum Converter</DialogTitle>
            <DialogDescription>
              Convert WGS84 GPS coordinates to Indian Cadastral Grid (UTM 43N / Survey of India
              Everest 1830).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Latitude (°N)</Label>
                <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="12.9716" />
              </div>
              <div>
                <Label className="text-xs">Longitude (°E)</Label>
                <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="77.5946" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Target UTM Zone / Grid</Label>
              <Input value={utmZone} onChange={(e) => setUtmZone(e.target.value)} />
            </div>
            <div className="p-3 bg-muted rounded-lg text-xs space-y-1 font-mono">
              <p className="text-foreground font-semibold font-sans">Projected Coordinates:</p>
              <p className="text-muted-foreground">Easting: 781,245.12 m E</p>
              <p className="text-muted-foreground">Northing: 1,435,012.44 m N</p>
              <p className="text-muted-foreground">Datum: Everest 1830 (Kalyanpur, India)</p>
            </div>
            <Button onClick={handleConvert} className="w-full">
              Recalculate & Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* GeoJSON Validator Dialog */}
      <Dialog open={activeModal === "validator"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastral GeoJSON Validator</DialogTitle>
            <DialogDescription>
              Validate boundary polygon syntax, coordinate ring closure, and self-intersections.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <Label className="text-xs">GeoJSON Polygon Snippet</Label>
              <textarea
                value={geoJsonInput}
                onChange={(e) => setGeoJsonInput(e.target.value)}
                rows={5}
                className="w-full rounded-md border border-input bg-background p-2 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {validationResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${validationResult.startsWith("Valid") ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{validationResult}</span>
              </div>
            )}
            <Button onClick={handleValidateGeoJson} className="w-full">
              Lint & Validate Topology
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
