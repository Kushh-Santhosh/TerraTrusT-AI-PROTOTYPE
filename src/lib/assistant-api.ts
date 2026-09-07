import type { Role } from "./auth";
import type { Property } from "./types";

export interface AssistantRequest {
  userId: string;
  actorRole: Role;
  conversationId?: string;
  propertyUuid?: string;
  question: string;
  currentRoute: string;
  context?: {
    selectedPropertyUuid?: string;
    property?: Property | null;
    properties?: Property[];
    verificationRun?: any;
    valuation?: any;
    [key: string]: any;
  };
}

export interface AssistantResponse {
  success: boolean;
  conversationId: string;
  messageId?: string;
  answer: string;
  role?: string;
  propertyUuid?: string | null;
  sources?: string[];
  data?: {
    trustScore?: number;
    verificationStatus?: string;
    status?: string;
    area?: number;
    valuationInr?: number;
    currency?: string;
    [key: string]: any;
  };
  citations?: { label: string; passportId?: string }[];
  suggestions?: string[];
  generatedAt?: string;
  error?: string;
}

export function getAssistantWebhookUrl(): string {
  const envUrl = import.meta.env.VITE_N8N_ASSISTANT_WEBHOOK_URL as string | undefined;
  return envUrl?.trim() || "https://kushhhsanthosh.app.n8n.cloud/webhook/terratrust/assistant";
}

/**
 * Executes a real query against the TerraTrust AI Assistant n8n workflow.
 * Does NOT generate fake responses.
 */
export async function askTerraAssistant(
  req: AssistantRequest,
  signal?: AbortSignal,
): Promise<AssistantResponse> {
  const url = getAssistantWebhookUrl();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  // Link caller signal if provided
  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const payloadData = {
      userId: req.userId,
      actorRole: req.actorRole,
      conversationId: req.conversationId,
      propertyUuid: req.propertyUuid,
      question: req.question,
      currentRoute: req.currentRoute,
      context: req.context || {},
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payloadData,
        body: payloadData,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMsg = `n8n webhook responded with HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.error) {
          errorMsg = errJson.error;
        }
      } catch {}
      return {
        success: false,
        conversationId: req.conversationId || "",
        answer: `TerraTrust AI is temporarily unavailable (${errorMsg}). Please check your connection and retry.`,
        error: errorMsg,
      };
    }

    let raw = await res.json();
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {}
    }

    const payload = Array.isArray(raw) ? raw[0] : raw;

    if (!payload || typeof payload !== "object") {
      return {
        success: false,
        conversationId: req.conversationId || "",
        answer: "Received an invalid response format from TerraTrust AI orchestrator.",
        error: "Invalid JSON response structure",
      };
    }

    return {
      success: payload.success ?? true,
      conversationId: payload.conversationId || req.conversationId || "",
      messageId: payload.messageId,
      answer: payload.answer || payload.message || payload.text || "No response received.",
      role: payload.role || req.actorRole,
      propertyUuid: payload.propertyUuid || req.propertyUuid,
      sources: Array.isArray(payload.sources) ? payload.sources : [],
      data: payload.data || {},
      citations: Array.isArray(payload.citations) ? payload.citations : [],
      suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
      generatedAt: payload.generatedAt || new Date().toISOString(),
      error: payload.error,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isAborted = controller.signal.aborted;
    const msg = isAborted ? "Request timed out after 20s" : err instanceof Error ? err.message : "Network error";
    return {
      success: false,
      conversationId: req.conversationId || "",
      answer: `TerraTrust AI is temporarily unreachable (${msg}). Please verify your network and retry.`,
      error: msg,
    };
  }
}
