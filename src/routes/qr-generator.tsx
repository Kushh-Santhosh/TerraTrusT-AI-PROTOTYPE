import { createFileRoute } from "@tanstack/react-router";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Copy, Download, RotateCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { passportVerificationUrl, publicAppOrigin } from "@/components/property/PassportQRCode";

export const Route = createFileRoute("/qr-generator")({
  head: () => ({ meta: [{ title: "QR Code Generator — TerraTrust AI" }] }),
  component: QRGeneratorPage,
});

function QRGeneratorPage() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const defaultUrl = `${publicAppOrigin}/properties`;
  const [url, setUrl] = useState(defaultUrl);
  const [passportId, setPassportId] = useState("");
  const [label, setLabel] = useState("TerraTrust Property Passport");
  const validUrl = useMemo(() => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    } catch {
      return false;
    }
  }, [url]);

  function reset() {
    setUrl(defaultUrl);
    setPassportId("");
    setLabel("TerraTrust Property Passport");
  }

  async function copyUrl() {
    if (!validUrl) return;
    await navigator.clipboard.writeText(url);
    toast.success("Encoded URL copied");
  }

  function downloadSvg() {
    const svg = document.querySelector<SVGElement>("[data-generator-qr]");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "terratrust-passport-qr.svg";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function downloadPng() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "terratrust-passport-qr.png";
    link.click();
  }

  return (
    <AppShell title="QR Code Generator" subtitle="Create a scannable TerraTrust verification credential from a real passport URL.">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="surface-card space-y-5 p-6">
          <div>
            <label className="text-sm font-medium" htmlFor="verification-url">Verification URL</label>
            <Input id="verification-url" value={url} onChange={(event) => setUrl(event.target.value)} className="mt-2" />
            {!validUrl && <p className="mt-2 text-xs text-destructive">Enter a valid HTTPS TerraTrust URL.</p>}
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="passport-id">Property Passport ID <span className="text-muted-foreground">(optional)</span></label>
            <Input id="passport-id" value={passportId} onChange={(event) => setPassportId(event.target.value)} placeholder="TT-KA-2609-P1R4N" className="mt-2 font-mono" />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="qr-label">Label or title <span className="text-muted-foreground">(optional)</span></label>
            <Input id="qr-label" value={label} onChange={(event) => setLabel(event.target.value)} className="mt-2" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyUrl} disabled={!validUrl}><Copy className="mr-1.5 h-4 w-4" /> Copy URL</Button>
            <Button variant="outline" onClick={reset}><RotateCcw className="mr-1.5 h-4 w-4" /> Reset</Button>
          </div>
        </div>
        <div className="surface-card flex min-w-0 flex-col items-center gap-4 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{label || "TerraTrust AI"}</p>
          <div className="rounded-xl bg-white p-4 ring-1 ring-border" ref={canvasRef}>
            {validUrl ? <QRCodeSVG value={url} size={220} level="M" marginSize={4} data-generator-qr role="img" aria-label={`QR code for ${url}`} /> : <div className="grid h-[220px] w-[220px] place-items-center text-sm text-muted-foreground">Enter a valid URL</div>}
            <div className="hidden"><QRCodeCanvas value={validUrl ? url : "https://example.invalid"} size={440} level="M" marginSize={16} /></div>
          </div>
          {passportId && <p className="font-mono text-xs text-muted-foreground">{passportId}</p>}
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" variant="outline" onClick={downloadPng} disabled={!validUrl}><Download className="mr-1.5 h-4 w-4" /> PNG</Button>
            <Button size="sm" variant="outline" onClick={downloadSvg} disabled={!validUrl}><Download className="mr-1.5 h-4 w-4" /> SVG</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
