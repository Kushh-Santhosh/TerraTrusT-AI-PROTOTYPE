import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import type { Property } from "@/lib/types";
import { loadOwnedProperties, loadInstitutionalProperties } from "@/lib/property-repository";
import { askTerraAssistant, type AssistantResponse } from "@/lib/assistant-api";

export interface AssistantChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: string[];
  data?: Record<string, unknown>;
  citations?: { label: string; passportId?: string }[];
  suggestions?: string[];
  timestamp: string;
  isError?: boolean;
}

interface AssistantContextType {
  isOpen: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  activeProperty: Property | null;
  setActiveProperty: (p: Property | null) => void;
  userProperties: Property[];
  messages: AssistantChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  retryLast: () => Promise<void>;
  clearConversation: () => void;
  suggestedQuestions: string[];
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const routerState = useRouterState();
  const currentRoute = routerState.location.pathname;

  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("terratrust_assistant_conv_id");
      if (stored) return stored;
    } catch {
      // Continue with a fresh conversation when local storage is unavailable.
    }
    const fresh = `CONV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    try {
      localStorage.setItem("terratrust_assistant_conv_id", fresh);
    } catch {
      // Local storage is optional in restricted browser contexts.
    }
    return fresh;
  });

  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);

  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    {
      id: "msg_seed",
      role: "assistant",
      text: "Namaste — I am **Terra**, your real-time property intelligence assistant. Grounded in authoritative cadastral records, Karnataka Bhoomi / Kaveri 2.0 registries, sub-registrar valuations, and verified boundary surveys. How can I assist you with your land assets?",
      timestamp: new Date().toISOString(),
    },
  ]);

  // Load user properties dynamically from Supabase
  useEffect(() => {
    let cancelled = false;
    async function fetchUserProps() {
      if (!user?.id) return;
      const role = profile?.role || "citizen";
      let props: Property[] = [];
      if (role === "citizen") {
        props = await loadOwnedProperties(user.id);
      } else {
        props = await loadInstitutionalProperties();
      }
      if (!cancelled) {
        setUserProperties(props);
        if (props.length > 0 && !activeProperty) {
          setActiveProperty(props[0]);
        }
      }
    }
    fetchUserProps();
    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.role]);

  // Dynamic suggested questions calculated from real database state
  const computeSuggestions = useCallback((): string[] => {
    if (!activeProperty) {
      if (userProperties.length === 0) {
        return [
          "How do I register a new property in Karnataka?",
          "What documents are required for Bhoomi RTC matching?",
          "What is the automated verification threshold?",
        ];
      }
      return [
        `What is the verification status of ${userProperties[0].title}?`,
        `Estimate the value of ${userProperties[0].title}`,
        "What documents are missing from my portfolio?",
      ];
    }

    const p = activeProperty;
    const suggestions: string[] = [];

    if (p.status === "verified") {
      suggestions.push(`Why is ${p.title} verified with a trust score of ${p.trustScore}?`);
      suggestions.push(`Is ${p.title} eligible as bank collateral?`);
      suggestions.push(`What is the sub-registrar valuation of ${p.title}?`);
    } else if (p.status === "pending" || p.status === "disputed") {
      suggestions.push(`Why is ${p.title} trust score at ${p.trustScore}/100?`);
      suggestions.push(`What documents are still missing for ${p.title}?`);
      suggestions.push(`What is the land boundary area for this parcel?`);
    } else {
      suggestions.push(`What is the next step for ${p.title}?`);
      suggestions.push(`What is the valuation for ${p.title}?`);
    }

    return suggestions;
  }, [activeProperty, userProperties]);

  const sendMessage = async (text: string) => {
    const q = text.trim();
    if (!q || isLoading) return;

    setError(null);
    setLastFailedQuestion(null);

    const userMsg: AssistantChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: "user",
      text: q,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const role = profile?.role || "citizen";
    const res: AssistantResponse = await askTerraAssistant({
      userId: user?.id || "00000000-0000-0000-0000-000000000000",
      actorRole: role,
      conversationId,
      propertyUuid: activeProperty?.id,
      question: q,
      currentRoute,
      context: {
        selectedPropertyUuid: activeProperty?.id,
        property: activeProperty,
        properties: userProperties,
      },
    });

    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to reach TerraTrust AI Assistant");
      setLastFailedQuestion(q);
      const errorMsg: AssistantChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: "assistant",
        text: res.answer,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      return;
    }

    const assistantMsg: AssistantChatMessage = {
      id: res.messageId || `msg_a_${Date.now()}`,
      role: "assistant",
      text: res.answer,
      sources: res.sources,
      data: res.data,
      citations: res.citations,
      suggestions: res.suggestions,
      timestamp: res.generatedAt || new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
  };

  const retryLast = async () => {
    if (lastFailedQuestion) {
      await sendMessage(lastFailedQuestion);
    }
  };

  const clearConversation = () => {
    const freshId = `CONV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setConversationId(freshId);
    try {
      localStorage.setItem("terratrust_assistant_conv_id", freshId);
    } catch {
      // Local storage is optional in restricted browser contexts.
    }
    setMessages([
      {
        id: "msg_seed",
        role: "assistant",
        text: "Namaste — I am **Terra**, your real-time property intelligence assistant. Grounded in authoritative cadastral records, Karnataka Bhoomi / Kaveri 2.0 registries, sub-registrar valuations, and verified boundary surveys. How can I assist you with your land assets?",
        timestamp: new Date().toISOString(),
      },
    ]);
    setError(null);
    setLastFailedQuestion(null);
  };

  return (
    <AssistantContext.Provider
      value={{
        isOpen,
        openAssistant: () => setIsOpen(true),
        closeAssistant: () => setIsOpen(false),
        toggleAssistant: () => setIsOpen((prev) => !prev),
        activeProperty,
        setActiveProperty,
        userProperties,
        messages,
        isLoading,
        error,
        sendMessage,
        retryLast,
        clearConversation,
        suggestedQuestions: computeSuggestions(),
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistant must be used within an AssistantProvider");
  }
  return ctx;
}
