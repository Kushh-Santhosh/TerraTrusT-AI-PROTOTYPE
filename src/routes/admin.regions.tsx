import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { KpiRow, Pill } from "@/components/ui-ext/Scaffold";
import { getAllStateProfiles, type StateLandProfile } from "@/lib/state-registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Layers,
  FileText,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Database,
} from "lucide-react";

export const Route = createFileRoute("/admin/regions")({
  head: () => ({
    meta: [
      { title: "State Land Verification Profiles — TerraTrust Admin" },
      {
        name: "description",
        content:
          "Authoritative state land record profiles, official registries (Bhoomi, Mahabhumi, MeeBhoomi), and cadastral field configurations.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const profiles = getAllStateProfiles();
  const [selectedStateCode, setSelectedStateCode] = useState<string>("KA");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    India: true,
    KA: true,
    MH: true,
    AP: false,
    TS: false,
    KL: false,
    UP: false,
    RJ: false,
    DL: false,
  });

  const selectedProfile = profiles.find((p) => p.stateCode === selectedStateCode) || profiles[0];

  const toggleNode = (key: string) => {
    setExpandedNodes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalSystems = profiles.reduce((acc, p) => acc + p.officialSystems.length, 0);

  return (
    <AppShell
      title="State Land Verification Profiles"
      subtitle="Federated state land registry configuration, terminology mapping, and official evidentiary connectors."
      requiredRole={["admin"]}
    >
      <KpiRow
        items={[
          { label: "Configured States", value: `${profiles.length} States` },
          { label: "Official Systems", value: `${totalSystems} Registries` },
          { label: "DILRMP Alignment", value: "100%" },
          { label: "Automated API Fallbacks", value: "Strict Evidentiary" },
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* State Hierarchy Tree View */}
        <div className="surface-card p-5">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-primary" /> India Land Registry Tree
            </p>
            <span className="text-[10px] font-mono text-primary font-bold">
              {profiles.length} Active Profiles
            </span>
          </div>

          <div className="font-mono text-xs space-y-1 select-none">
            {/* Root Node: India */}
            <div>
              <button
                type="button"
                onClick={() => toggleNode("India")}
                className="flex items-center gap-1.5 w-full text-left py-1 px-1.5 rounded hover:bg-muted font-bold text-foreground"
              >
                {expandedNodes.India ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span>🇮🇳 India (Republic of India)</span>
              </button>

              {expandedNodes.India && (
                <div className="ml-4 pl-2 border-l border-border/60 space-y-1 mt-1">
                  {profiles.map((p) => {
                    const isSelected = p.stateCode === selectedStateCode;
                    const isExpanded = expandedNodes[p.stateCode];

                    return (
                      <div key={p.stateCode}>
                        <div
                          className={`flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary/15 text-primary font-bold"
                              : "hover:bg-muted text-foreground"
                          }`}
                          onClick={() => setSelectedStateCode(p.stateCode)}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNode(p.stateCode);
                              }}
                              className="p-0.5 hover:bg-muted/80 rounded"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              )}
                            </button>
                            <span className="truncate">{p.stateName}</span>
                          </div>
                          <span className="text-[10px] font-mono opacity-70">
                            {p.officialSystems.length} sys
                          </span>
                        </div>

                        {/* Child systems */}
                        {isExpanded && (
                          <div className="ml-6 pl-2 border-l border-border/40 space-y-0.5 mt-0.5">
                            {p.officialSystems.map((sys) => (
                              <div
                                key={sys.id}
                                className="text-[11px] py-0.5 px-1.5 text-muted-foreground flex items-center justify-between hover:text-foreground"
                              >
                                <span className="truncate">├── {sys.name.split(" ")[0]}</span>
                                <span className="text-[9px] font-mono uppercase opacity-60">
                                  {sys.category.slice(0, 4)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected State Profile Detail View */}
        <div className="space-y-6">
          <div className="surface-card p-5 border-l-4 border-l-primary">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">
                    {selectedProfile.stateName} ({selectedProfile.stateCode})
                  </h2>
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/30 text-xs"
                  >
                    State Land Profile
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Primary Area Unit:{" "}
                  <strong>{selectedProfile.unitConversion.primaryLocalUnit}</strong> (
                  {selectedProfile.unitConversion.label})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Local RoR:</span>
                <span className="text-xs font-semibold font-mono bg-muted px-2 py-0.5 rounded">
                  {selectedProfile.localTerminology.recordOfRightsName}
                </span>
              </div>
            </div>

            {/* Terminology Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="rounded-lg border border-border/70 bg-background/50 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Survey Label
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  {selectedProfile.localTerminology.surveyNumberLabel}
                </p>
              </div>

              <div className="rounded-lg border border-border/70 bg-background/50 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Subdivision / Hissa
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  {selectedProfile.localTerminology.subdivisionLabel}
                </p>
              </div>

              <div className="rounded-lg border border-border/70 bg-background/50 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Khata / Urban ID
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  {selectedProfile.localTerminology.khataOrAccountLabel}
                </p>
              </div>

              <div className="rounded-lg border border-border/70 bg-background/50 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Deed Registry System
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  {selectedProfile.localTerminology.deedRegistrationSystemName}
                </p>
              </div>
            </div>
          </div>

          {/* Official Systems List */}
          <div className="surface-card p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Official Government Systems (
                  {selectedProfile.officialSystems.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verified public portals and evidentiary connectors for {selectedProfile.stateName}
                  .
                </p>
              </div>
              <span className="text-xs text-muted-foreground">Zero mock connections</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {selectedProfile.officialSystems.map((sys) => (
                <div
                  key={sys.id}
                  className="rounded-xl border border-border/80 bg-background/60 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-xs text-foreground">{sys.name}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono shrink-0 ${
                          sys.adapterStatus === "DOCUMENT_EVIDENCE"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : sys.adapterStatus === "AUTHORIZED_CONNECTOR"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                              : sys.adapterStatus === "MANUAL_REVIEW"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {sys.adapterStatus.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{sys.department}</p>
                    <p className="text-[11px] text-foreground/80 mt-2 leading-relaxed">
                      {sys.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-mono text-[10px]">
                      Required: {sys.requiredFields.join(", ")}
                    </span>
                    <a
                      href={sys.officialPortalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      Portal <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cadastral Form Fields Configured for this State */}
          <div className="surface-card p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground mb-3">
              <Layers className="h-4 w-4 text-primary" /> Configured Cadastral Registration Fields
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedProfile.cadastralFields.map((field) => (
                <div
                  key={field.key}
                  className="rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs flex items-center gap-2"
                >
                  <span className="font-semibold text-foreground">{field.label}</span>
                  {field.required && (
                    <span className="text-[10px] text-destructive font-mono">*required</span>
                  )}
                  {field.isUrbanOnly && (
                    <span className="text-[10px] text-primary font-mono bg-primary/10 px-1 rounded">
                      urban
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
