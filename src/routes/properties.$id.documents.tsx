import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Crumbs, Pill } from "@/components/ui-ext/Scaffold";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { PropertySubNav } from "@/components/property/PropertySubNav";
import { loadPropertyById } from "@/lib/property-repository";
import {
  createDocumentSignedUrl,
  uploadPropertyDocumentBinary,
  savePropertyDocument,
} from "@/lib/supabase-persistence";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";
import type { Property, PropertyDocument } from "@/lib/types";

export const Route = createFileRoute("/properties/$id/documents")({
  head: () => ({ meta: [{ title: "Documents — TerraTrust AI" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  // Direct upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<"deed" | "survey" | "tax" | "id" | "other">(
    "deed",
  );

  const refreshProperty = async () => {
    const p = await loadPropertyById(id);
    if (p) setProperty(p);
    setLoading(false);
  };

  useEffect(() => {
    refreshProperty();
  }, [id]);

  const handleOpenSignedDoc = async (doc: PropertyDocument) => {
    if (!doc.storagePath) {
      setOpenError(`Document "${doc.name}" does not have a linked storage object.`);
      return;
    }
    setOpenError(null);
    setOpeningDocId(doc.id);
    try {
      const { signedUrl, error } = await createDocumentSignedUrl(doc.storagePath, 180);
      if (error || !signedUrl) {
        setOpenError(error || "Could not generate secure document URL.");
      } else {
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : "Error accessing document");
    } finally {
      setOpeningDocId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadSuccess(null);
    setOpenError(null);

    try {
      // 1. Upload binary to Supabase Storage
      const { storagePath, error: uploadErr } = await uploadPropertyDocumentBinary({
        userId: user.id,
        propertyId: id,
        file,
      });

      if (uploadErr || !storagePath) {
        setOpenError(uploadErr || "Failed to upload file to storage.");
        setIsUploading(false);
        return;
      }

      // 2. Insert metadata record in PostgreSQL
      const saveRes = await savePropertyDocument({
        propertyId: id,
        name: file.name,
        kind: selectedKind,
        storagePath,
        verified: false,
      });

      if (!saveRes.persisted) {
        setOpenError(saveRes.error || "Uploaded file but failed to persist document metadata.");
      } else {
        setUploadSuccess(
          `"${file.name}" successfully uploaded and registered in Evidentiary Vault.`,
        );
        await refreshProperty();
      }
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : "Upload exception occurred.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const docs = property?.documents ?? [];

  return (
    <AppShell
      title="Property Documents"
      subtitle="Upload, inspect, and verify cryptographic evidentiary land records for this Property Passport."
      actions={
        <Button asChild>
          <Link to="/properties/$id/verify" params={{ id }}>
            <Upload className="h-4 w-4 mr-1" /> Run Verification
          </Link>
        </Button>
      }
    >
      <Crumbs
        items={[
          { label: "Properties", to: "/properties" },
          { label: id, to: "/properties/$id" },
          { label: "Documents" },
        ]}
      />
      <PropertySubNav propertyId={id} activeTab="documents" />

      {/* Upload Zone */}
      <div className="surface-card rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center">
        <FileText className="mx-auto h-8 w-8 text-primary/60 mb-2" />
        <p className="text-sm font-semibold text-foreground">Evidentiary Title Vault</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-lg mx-auto">
          Private, encrypted document storage via Supabase Storage. Uploaded title deeds, survey
          maps, RTC/e-Khata extracts, and revenue records are protected by cryptographic signed
          access tokens.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <select
            id="doc-upload-kind"
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value as typeof selectedKind)}
            disabled={isUploading}
            aria-label="Select Document Category"
            className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="deed">Title Deed / Sale Deed</option>
            <option value="survey">Cadastral Survey Map / Sketch</option>
            <option value="tax">Tax / e-Khata / Revenue Receipt</option>
            <option value="id">Owner Identity Proof</option>
            <option value="other">Other Official Document</option>
          </select>

          <input
            ref={fileInputRef}
            type="file"
            id="doc-file-input"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.geojson,.kml"
            onChange={handleFileUpload}
            disabled={isUploading}
          />

          <Button
            id="btn-trigger-doc-upload"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !user}
            className="gap-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading to Vault…
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" /> Upload Evidentiary Record
              </>
            )}
          </Button>
        </div>

        {uploadSuccess && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="h-4 w-4" /> {uploadSuccess}
          </div>
        )}

        {openError && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-destructive font-medium">
            <AlertTriangle className="h-4 w-4" /> {openError}
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Attached Documents ({docs.length})
          </h4>
          <span className="text-xs text-muted-foreground">
            Signed access links expire after 180 seconds
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : docs.length === 0 ? (
          <div className="surface-card py-10 text-center text-sm text-muted-foreground">
            No persisted documents are attached to this property yet. Upload a title deed or
            cadastral map above.
          </div>
        ) : (
          docs.map((d) => (
            <div
              key={d.id}
              className="surface-card flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="capitalize font-medium text-foreground">{d.kind}</span> ·
                    Uploaded{" "}
                    {new Date(d.uploadedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {d.storagePath ? " · Private Vault Object" : " · Metadata Record"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {d.verified ? (
                  <Pill tone="success">
                    <ShieldCheck className="h-3 w-3 inline mr-1" /> Verified
                  </Pill>
                ) : (
                  <Pill tone="warning">
                    <AlertTriangle className="h-3 w-3 inline mr-1" /> Pending
                  </Pill>
                )}

                {d.storagePath && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    disabled={openingDocId === d.id}
                    onClick={() => handleOpenSignedDoc(d)}
                  >
                    {openingDocId === d.id ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" /> Opening…
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-3 w-3" /> Secure View
                      </>
                    )}
                  </Button>
                )}

                <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                  <Link to="/properties/$id" params={{ id }}>
                    Passport
                  </Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
