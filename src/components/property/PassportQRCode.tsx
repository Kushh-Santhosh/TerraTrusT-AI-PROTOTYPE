import { QRCodeSVG } from "qrcode.react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Property } from "@/lib/types";

export const publicAppOrigin =
  import.meta.env.VITE_PUBLIC_APP_URL?.trim() || "https://terra-trus-t-ai-prototype.vercel.app";

export function passportVerificationUrl(propertyId: string): string {
  const origin = publicAppOrigin;
  return `${origin}/properties/${propertyId}`;
}

export function PassportQRCode({ property }: { property: Property }) {
  const [copied, setCopied] = useState(false);
  const url = passportVerificationUrl(property.id);
  const fileName = `${property.passportId.toLowerCase()}-qr`;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Verification link copied");
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadSvg() {
    const svg = document.querySelector<SVGElement>("[data-passport-qr]");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <section className="surface-card overflow-hidden border-primary/15">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            TerraTrust AI
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold">Digital Property Passport</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan to verify this property passport
          </p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium capitalize text-foreground ring-1 ring-border">
          {property.status.replace("_", " ")}
        </span>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="w-fit rounded-xl bg-white p-4 shadow-sm ring-1 ring-border" data-qr-frame>
          <QRCodeSVG
            value={url}
            size={184}
            level="M"
            marginSize={4}
            bgColor="#ffffff"
            fgColor="#0a1224"
            includeMargin
            data-passport-qr
            data-qr-value={url}
            role="img"
            aria-label={`QR code for ${property.passportId}`}
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Passport ID</p>
          <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">
            {property.passportId}
          </p>
          <p className="mt-3 break-all text-xs text-muted-foreground">{url}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={downloadSvg}>
              <Download className="mr-1.5 h-4 w-4" /> Download SVG
            </Button>
            <Button size="sm" variant="outline" onClick={copyLink}>
              {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}{" "}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a href={url}>
                <ExternalLink className="mr-1.5 h-4 w-4" /> Open passport
              </a>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/qr-generator">Create custom QR</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
