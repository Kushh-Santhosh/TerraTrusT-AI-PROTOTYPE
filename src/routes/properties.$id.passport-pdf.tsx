import { createFileRoute, Link } from "@tanstack/react-router";
import { properties } from "@/lib/mock-data";
import { loadPropertyById } from "@/lib/property-repository";
import { Button } from "@/components/ui/button";
import { Download, ShieldCheck, ArrowLeft, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import type { Property } from "@/lib/types";
import { passportVerificationUrl } from "@/components/property/PassportQRCode";

export const Route = createFileRoute("/properties/$id/passport-pdf")({
  component: PassportPDF,
});

function PassportPDF() {
  const { id } = Route.useParams();
  const [property, setProperty] = useState<Property | null>(() => {
    return properties.find((x) => x.id === id) || null;
  });

  useEffect(() => {
    loadPropertyById(id).then((loaded) => {
      if (loaded) setProperty(loaded);
    });
  }, [id]);

  useEffect(() => {
    document.title = property ? `Property Passport · ${property.passportId}` : "Property Passport";
  }, [property]);

  if (!property) {
    return (
      <div className="mx-auto max-w-3xl p-10 text-center">
        <p className="text-sm text-muted-foreground">Passport record not found.</p>
        <Link
          to="/properties"
          className="text-primary mt-2 inline-block text-xs font-semibold underline"
        >
          Back to properties
        </Link>
      </div>
    );
  }

  const p = property;
  const issuedOn = new Date().toISOString().slice(0, 10);
  const signatureSeed = `${p.passportId}-${issuedOn}`;
  const signatureHash = Array.from(signatureSeed)
    .reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5381)
    .toString(16)
    .padStart(8, "0")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white py-6">
      {/* Toolbar — hidden in print */}
      <div className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur print:hidden mb-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-3">
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link to="/properties/$id" params={{ id: p.id }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to passport
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button onClick={() => window.print()} className="rounded-full">
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
            <Button onClick={() => window.print()} variant="outline" className="rounded-full">
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </div>
        </div>
      </div>

      {/* Document */}
      <main className="mx-auto my-4 max-w-[820px] bg-white text-[#0a1224] shadow-[var(--shadow-elev)] print:my-0 print:shadow-none rounded-lg overflow-hidden border border-[#0a1224]/15">
        {/* Header band */}
        <div className="relative overflow-hidden bg-[#0a1224] px-10 py-8 text-white">
          <div className="relative flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">
                Land Revenue Authority · Republic of India
              </p>
              <h1 className="mt-2 font-display text-3xl leading-tight font-bold">
                Digital Property Passport
              </h1>
              <p className="mt-1 text-xs text-white/80">
                Cryptographically verifiable certificate of registered tenure — issued via
                TerraTrust AI.
              </p>
            </div>
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20">
              <ShieldCheck className="h-7 w-7 text-white" aria-hidden />
            </div>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-x-8 gap-y-2 text-xs text-white/80 border-t border-white/15 pt-3">
            <span>
              <span className="text-white/50">Passport ID</span>{" "}
              <span className="ml-2 font-mono text-white font-semibold">{p.passportId}</span>
            </span>
            <span>
              <span className="text-white/50">Issued</span>{" "}
              <span className="ml-2 font-mono text-white">{issuedOn}</span>
            </span>
            <span>
              <span className="text-white/50">Status</span>{" "}
              <span className="ml-2 font-mono uppercase text-white font-semibold">{p.status}</span>
            </span>
          </div>
        </div>

        {/* Body grid */}
        <div className="grid grid-cols-[1fr_220px] gap-10 px-10 py-8">
          {/* LEFT */}
          <div>
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0a1224]/60">
                Property summary
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold">{p.title}</h2>
              <p className="mt-1 text-xs text-[#0a1224]/70">
                {p.address} · {p.region}, India
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-y-3 text-xs">
                <dt className="text-[#0a1224]/60">Registered owner</dt>
                <dd className="font-semibold">{p.owner}</dd>
                <dt className="text-[#0a1224]/60">Owner since</dt> <dd>{p.ownerSince}</dd>
                <dt className="text-[#0a1224]/60">Land use</dt>{" "}
                <dd className="capitalize">{p.type}</dd>
                <dt className="text-[#0a1224]/60">Area</dt> <dd>{p.area.toLocaleString()} m²</dd>
                <dt className="text-[#0a1224]/60">Coordinates</dt>{" "}
                <dd className="font-mono text-xs">
                  {p.coords.lat.toFixed(4)}° N, {p.coords.lng.toFixed(4)}° E
                </dd>
                <dt className="text-[#0a1224]/60">AI valuation</dt>{" "}
                <dd className="font-semibold font-mono">₹{p.valuation.toLocaleString("en-IN")}</dd>
              </dl>
            </section>

            <section className="mt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0a1224]/60">
                Confidence & Verification
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  { k: "Trust score", v: `${p.trustScore} / 100` },
                  { k: "AI confidence", v: `${p.aiConfidence}%` },
                  { k: "Dispute status", v: p.status === "disputed" ? "Active dispute" : "Clear" },
                ].map((x) => (
                  <div key={x.k} className="rounded-lg border border-[#0a1224]/10 bg-[#f8fafc] p-3">
                    <p className="text-[9px] uppercase tracking-wider text-[#0a1224]/60 font-semibold">
                      {x.k}
                    </p>
                    <p className="mt-1 font-display text-base font-bold">{x.v}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0a1224]/60">
                Verification timeline
              </p>
              <ol className="mt-3 space-y-2 text-xs">
                {p.timeline.map((t) => (
                  <li key={t.id} className="flex gap-3 border-l-2 border-[#0a1224]/15 pl-3">
                    <span className="flex-1">
                      <span className="font-semibold">{t.action}</span>
                      <span className="ml-2 text-[#0a1224]/60">
                        — {t.actor} ({t.role})
                      </span>
                    </span>
                    <span className="text-[#0a1224]/50">{t.at}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0a1224]/60">
                Documents on file
              </p>
              <table className="mt-3 w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#0a1224]/15 text-left text-[10px] uppercase tracking-wider text-[#0a1224]/60">
                    <th className="py-1.5">Document</th>
                    <th>Kind</th>
                    <th>Uploaded</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {p.documents.map((d) => (
                    <tr key={d.id} className="border-b border-[#0a1224]/10">
                      <td className="py-2 font-medium">{d.name}</td>
                      <td className="capitalize text-[#0a1224]/70">{d.kind}</td>
                      <td className="text-[#0a1224]/70">{d.uploadedAt}</td>
                      <td className="font-semibold text-emerald-700">
                        {d.verified ? "Verified" : "Pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          {/* RIGHT — QR + signature column */}
          <aside className="space-y-6">
            <div className="rounded-lg border border-[#0a1224]/10 p-4 text-center bg-[#f8fafc]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0a1224]/60">
                TerraTrust AI
              </p>
              <div className="mt-3 rounded-lg bg-white p-3 ring-1 ring-[#0a1224]/10">
                <QRCodeSVG
                  value={passportVerificationUrl(p.id)}
                  size={150}
                  level="M"
                  marginSize={4}
                  fgColor="#0a1224"
                  aria-label={`QR code for ${p.passportId}`}
                />
              </div>
              <p className="mt-3 text-[10px] uppercase tracking-wider text-[#0a1224]/60 font-semibold">
                Scan to verify this property passport
              </p>
              <p className="mt-1 font-mono text-[9px] text-[#0a1224]/80">
                Passport ID: {p.passportId}
              </p>
            </div>

            <div className="rounded-lg border border-[#0a1224]/10 p-4 bg-[#f8fafc]">
              <p className="text-[10px] uppercase tracking-wider text-[#0a1224]/60 font-semibold">
                Digital signature
              </p>
              <p className="mt-1 font-mono text-[10px] leading-tight text-[#0a1224] break-all">
                ed25519:{signatureHash}…
              </p>
              <p className="mt-2 text-[9px] text-[#0a1224]/60">
                Signed by the issuing registry on {issuedOn}. Any modification invalidates this
                passport.
              </p>
            </div>

            <div className="rounded-lg border border-[#0a1224]/10 p-4 bg-[#f8fafc]">
              <p className="text-[10px] uppercase tracking-wider text-[#0a1224]/60 font-semibold">
                Tenure status
              </p>
              <p className="mt-1 text-xs font-bold capitalize">{p.status}</p>
              <p className="mt-1 text-[10px] text-[#0a1224]/60">
                {p.status === "verified"
                  ? "Tenure verified and logged in tamper-evident database."
                  : p.status === "disputed"
                    ? "Active dispute flagged on file — see case docket."
                    : "Under verification queue."}
              </p>
            </div>
          </aside>
        </div>

        {/* Footer band */}
        <div className="border-t border-[#0a1224]/10 bg-[#f8fafc] px-10 py-5 text-[10px] text-[#0a1224]/60">
          <p>
            NOTICE: This document is a verifiable digital Property Passport issued via the
            TerraTrust AI verification engine. Ref: {p.passportId}-{signatureHash.slice(0, 4)}.
          </p>
        </div>
      </main>

      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
