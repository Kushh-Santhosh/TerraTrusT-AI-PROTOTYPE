import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileCheck,
} from "lucide-react";

export type DocumentKind = "deed" | "survey" | "tax" | "id" | "other";

export interface QueuedDocument {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  kind: DocumentKind;
  status: "queued" | "uploading" | "success" | "error";
  error?: string;
  storagePath?: string;
}

const KIND_LABELS: Record<DocumentKind, string> = {
  deed: "Registered Sale Deed / Title",
  survey: "Cadastral Survey Map / Sketch",
  tax: "Property Tax Clearance / Khata",
  id: "Government Identity (Aadhaar/PAN)",
  other: "Supporting Evidence / Encumbrance Cert",
};

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB limit

interface DocumentUploaderProps {
  documents: QueuedDocument[];
  onChange: (docs: QueuedDocument[]) => void;
  disabled?: boolean;
}

export function DocumentUploader({ documents, onChange, disabled = false }: DocumentUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processFiles = (files: FileList | File[]) => {
    setValidationError(null);
    const newDocs: QueuedDocument[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        errors.push(`"${file.name}": Unsupported format. Only PDF, JPG, and PNG are accepted.`);
        return;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}": File size (${formatFileSize(file.size)}) exceeds 15MB limit.`);
        return;
      }

      // Check duplicates
      if (documents.some((d) => d.name === file.name && d.size === file.size)) {
        errors.push(`"${file.name}" is already queued.`);
        return;
      }

      // Infer default document kind based on filename
      let inferredKind: DocumentKind = "other";
      const lower = file.name.toLowerCase();
      if (
        lower.includes("deed") ||
        lower.includes("title") ||
        lower.includes("conveyance") ||
        lower.includes("sale")
      ) {
        inferredKind = "deed";
      } else if (
        lower.includes("survey") ||
        lower.includes("map") ||
        lower.includes("sketch") ||
        lower.includes("cadastral")
      ) {
        inferredKind = "survey";
      } else if (
        lower.includes("tax") ||
        lower.includes("receipt") ||
        lower.includes("khata") ||
        lower.includes("patta")
      ) {
        inferredKind = "tax";
      } else if (
        lower.includes("id") ||
        lower.includes("aadhaar") ||
        lower.includes("pan") ||
        lower.includes("passport")
      ) {
        inferredKind = "id";
      }

      newDocs.push({
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        kind: inferredKind,
        status: "queued",
      });
    });

    if (errors.length > 0) {
      setValidationError(errors.join(" "));
    }

    if (newDocs.length > 0) {
      onChange([...documents, ...newDocs]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeDoc = (id: string) => {
    if (disabled) return;
    onChange(documents.filter((d) => d.id !== id));
  };

  const updateKind = (id: string, kind: DocumentKind) => {
    if (disabled) return;
    onChange(documents.map((d) => (d.id === id ? { ...d, kind } : d)));
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div
        id="document-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
          disabled
            ? "border-muted bg-muted/20 opacity-60 cursor-not-allowed"
            : isDragOver
              ? "border-primary bg-primary/10 shadow-lg scale-[1.01]"
              : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          id="property-doc-file-input"
          onChange={handleFileInputChange}
          disabled={disabled}
        />

        <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:scale-110">
          <UploadCloud className="h-6 w-6" />
        </div>

        <p className="font-medium text-foreground">Click to upload or drag & drop documents</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Supports Registered Deed, Cadastral Survey Plan, Tax Receipts, and ID proofs (PDF, JPG,
          PNG up to 15MB)
        </p>

        <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileCheck className="h-3.5 w-3.5 text-primary" /> Stored in Private Supabase Storage
          </span>
          <span>·</span>
          <span>Encrypted with User RLS</span>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Queued Documents List */}
      {documents.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
            <p className="text-sm font-semibold text-foreground">
              Selected Documents ({documents.length})
            </p>
            <p className="text-xs text-muted-foreground">
              Total: {formatFileSize(documents.reduce((acc, d) => acc + d.size, 0))}
            </p>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => {
              const isPdf = doc.type.includes("pdf");
              return (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 p-3 hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                      {isPdf ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatFileSize(doc.size)} ·{" "}
                        {doc.type.split("/")[1]?.toUpperCase() || "FILE"}
                      </p>
                    </div>
                  </div>

                  {/* Document Category Selector */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <select
                      aria-label={`Category for ${doc.name}`}
                      value={doc.kind}
                      onChange={(e) => updateKind(doc.id, e.target.value as DocumentKind)}
                      disabled={disabled}
                      className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {Object.entries(KIND_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>

                    {/* Status badge */}
                    {doc.status === "uploading" && (
                      <span className="text-xs text-primary animate-pulse font-medium">
                        Uploading…
                      </span>
                    )}
                    {doc.status === "success" && (
                      <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
                      </span>
                    )}
                    {doc.status === "error" && (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-destructive font-medium"
                        title={doc.error}
                      >
                        <AlertCircle className="h-3.5 w-3.5" /> Failed
                      </span>
                    )}

                    {!disabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeDoc(doc.id)}
                        title="Remove document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
