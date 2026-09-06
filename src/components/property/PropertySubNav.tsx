import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  FileBadge, Workflow, Sparkles, FileText, Compass,
  Layers, History, Satellite, Clock, Share2, ArrowRightLeft, Download
} from "lucide-react";

interface PropertySubNavProps {
  propertyId: string;
  activeTab:
    | "overview"
    | "passport"
    | "verify"
    | "ai-analysis"
    | "documents"
    | "boundary"
    | "gis-layers"
    | "ownership"
    | "satellite"
    | "timeline"
    | "share"
    | "transfer"
    | "passport-pdf";
}

export function PropertySubNav({ propertyId, activeTab }: PropertySubNavProps) {
  const tabs = [
    { id: "overview", label: "Overview", to: "/properties/$id", icon: FileBadge },
    { id: "passport", label: "Passport", to: "/properties/$id", icon: FileBadge },
    { id: "verify", label: "Verification", to: "/properties/$id/verify", icon: Workflow },
    { id: "ai-analysis", label: "AI Analysis", to: "/properties/$id/ai-analysis", icon: Sparkles },
    { id: "documents", label: "Documents", to: "/properties/$id/documents", icon: FileText },
    { id: "boundary", label: "Boundary", to: "/properties/$id/boundary", icon: Compass },
    { id: "gis-layers", label: "GIS Layers", to: "/properties/$id/gis-layers", icon: Layers },
    { id: "ownership", label: "Ownership", to: "/properties/$id/ownership", icon: History },
    { id: "satellite", label: "Satellite", to: "/properties/$id/satellite", icon: Satellite },
    { id: "timeline", label: "Timeline", to: "/properties/$id/timeline", icon: Clock },
    { id: "share", label: "Share", to: "/properties/$id/share", icon: Share2 },
    { id: "transfer", label: "Transfer", to: "/properties/$id/transfer", icon: ArrowRightLeft },
    { id: "passport-pdf", label: "Passport PDF", to: "/properties/$id/passport-pdf", icon: Download },
  ];

  return (
    <div className="my-4 overflow-x-auto pb-1">
      <div className="flex items-center gap-1.5 min-w-max border-b border-border/70 pb-2">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={tab.to}
              params={{ id: propertyId }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition font-medium",
                isActive
                  ? "bg-primary/15 text-primary font-semibold ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <tab.icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
