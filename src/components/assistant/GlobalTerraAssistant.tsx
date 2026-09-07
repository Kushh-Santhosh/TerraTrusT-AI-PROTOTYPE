import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Send,
  X,
  Bot,
  User as UserIcon,
  RotateCcw,
  AlertCircle,
  FileBadge,
  Building2,
  ChevronDown,
  Layers,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAssistant } from "@/context/AssistantContext";
import { useAuth, roleLabels } from "@/lib/auth";

export function GlobalTerraAssistant() {
  const { user, profile } = useAuth();
  const {
    isOpen,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    activeProperty,
    setActiveProperty,
    userProperties,
    messages,
    isLoading,
    error,
    sendMessage,
    retryLast,
    clearConversation,
    suggestedQuestions,
  } = useAssistant();

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  if (!user) return null;

  const role = profile?.role || "citizen";
  const roleLabel = roleLabels[role] || "Citizen";

  const handleSend = () => {
    const q = input.trim();
    if (!q || isLoading) return;
    setInput("");
    sendMessage(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Launcher Trigger */}
      {!isOpen && (
        <aside aria-label="Terra AI Assistant Launcher" className="fixed bottom-6 right-6 z-40">
          <button
            onClick={openAssistant}
            className="group relative flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary px-4 py-3 text-primary-foreground shadow-xl transition-all duration-200 hover:scale-105 hover:bg-primary/95 hover:shadow-primary/20 active:scale-95"
            aria-label="Open Terra AI Assistant"
            id="terra-assistant-launcher"
          >
            <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/15 text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            </div>
            <span className="text-xs font-semibold tracking-wide">Ask Terra</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          </button>
        </aside>
      )}

      {/* Slide-in Assistant Drawer / Floating Panel */}
      {isOpen && (
        <aside
          aria-label="Terra AI Assistant Panel"
          className="fixed bottom-0 right-0 z-50 flex h-[92vh] max-h-[720px] w-full flex-col border border-border bg-background shadow-2xl md:bottom-6 md:right-6 md:h-[680px] md:w-[420px] md:rounded-2xl overflow-hidden backdrop-blur-xl"
          id="terra-assistant-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Terra</h3>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                    Live n8n
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                  Your TerraTrust property intelligence assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="New conversation"
                onClick={clearConversation}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Close assistant"
                onClick={closeAssistant}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Property Context Selector Bar */}
          <div className="border-b border-border/60 bg-muted/20 px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span className="font-medium">Context:</span>
            </div>

            {userProperties.length > 0 ? (
              <select
                aria-label="Active Property Context"
                value={activeProperty?.id || ""}
                onChange={(e) => {
                  const target = userProperties.find((p) => p.id === e.target.value) || null;
                  setActiveProperty(target);
                }}
                className="max-w-[220px] truncate rounded border border-border bg-surface px-2 py-0.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {userProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.passportId})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] text-muted-foreground italic">
                No registered properties
              </span>
            )}
          </div>

          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] space-y-2 rounded-2xl p-3 leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground font-medium rounded-tr-none"
                      : m.isError
                        ? "bg-destructive/10 border border-destructive/30 text-destructive rounded-tl-none"
                        : "bg-surface border border-border text-foreground rounded-tl-none"
                  }`}
                >
                  <div className="prose prose-xs dark:prose-invert max-w-none break-words leading-relaxed text-[12px]">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>

                  {/* Sources / Citations */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5 border-t border-border/30">
                      {m.citations.map((c, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono"
                        >
                          <FileBadge className="h-3 w-3" /> {c.label} {c.passportId && `(${c.passportId})`}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Structured Data Badges */}
                  {m.data && Object.keys(m.data).length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {m.data.trustScore != null && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          Score: {m.data.trustScore}/100
                        </span>
                      )}
                      {m.data.status && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                          {m.data.status}
                        </span>
                      )}
                      {m.data.area != null && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {m.data.area} sq.m
                        </span>
                      )}
                    </div>
                  )}

                  {/* Suggested Follow-up Prompts */}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {m.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(s)}
                          disabled={isLoading}
                          className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] text-primary hover:bg-primary/10 transition text-left"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {m.role === "user" && (
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground mt-0.5">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
                <Bot className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span>Terra is querying n8n and Supabase…</span>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="truncate max-w-[220px]">{error}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[11px] border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={retryLast}
                  disabled={isLoading}
                >
                  Retry
                </Button>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Dynamic Suggested Questions Pills */}
          {messages.length <= 3 && suggestedQuestions.length > 0 && (
            <div className="border-t border-border/40 bg-muted/10 p-2.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Suggested Questions
              </p>
              <div className="flex flex-col gap-1">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(q)}
                    disabled={isLoading}
                    className="text-left truncate rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-border bg-surface p-3">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask about ${activeProperty?.title || "your property"}…`}
                disabled={isLoading}
                className="h-9 text-xs focus-visible:ring-primary"
                id="terra-assistant-input"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="h-9 w-9 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                id="terra-assistant-send-btn"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Role: <strong className="text-foreground capitalize">{roleLabel}</strong></span>
              <span>Protected by Supabase RLS</span>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
