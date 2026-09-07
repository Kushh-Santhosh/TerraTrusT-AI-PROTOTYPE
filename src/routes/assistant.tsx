import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Bot, User as UserIcon, FileBadge, Building2, RotateCcw, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAssistant } from "@/context/AssistantContext";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — TerraTrust AI" }] }),
  component: AssistantPage,
});

function AssistantPage() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    retryLast,
    clearConversation,
    activeProperty,
    setActiveProperty,
    userProperties,
    suggestedQuestions,
  } = useAssistant();

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  };

  return (
    <AppShell
      title="AI Assistant"
      subtitle="Ask grounded questions across your live land records, Bhoomi cadastral registries, valuations, and verification pipelines."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={clearConversation}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>New Conversation</span>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main Chat Container */}
        <div className="surface-card flex h-[74vh] flex-col overflow-hidden border border-border">
          {/* Active Context Bar */}
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Active Property Context:</span>
            </div>
            {userProperties.length > 0 ? (
              <select
                aria-label="Target property context"
                value={activeProperty?.id || ""}
                onChange={(e) => {
                  const found = userProperties.find((p) => p.id === e.target.value) || null;
                  setActiveProperty(found);
                }}
                className="max-w-[240px] truncate rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {userProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.passportId})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-muted-foreground italic">No registered properties in portfolio</span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-xl space-y-3 rounded-2xl p-4 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground font-medium rounded-tr-none"
                      : m.isError
                        ? "bg-destructive/10 border border-destructive/30 text-destructive rounded-tl-none"
                        : "bg-surface border border-border text-foreground rounded-tl-none"
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-xs md:text-sm">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>

                  {/* Citations */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                      {m.citations.map((c, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground font-mono"
                        >
                          <FileBadge className="h-3 w-3" /> {c.label} {c.passportId && `(${c.passportId})`}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Structured Data Badges */}
                  {m.data && Object.keys(m.data).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {m.data.trustScore != null && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                          Score: {m.data.trustScore}/100
                        </Badge>
                      )}
                      {m.data.status && (
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {m.data.status}
                        </Badge>
                      )}
                      {m.data.area != null && (
                        <Badge variant="secondary" className="text-[10px]">
                          {m.data.area} sq.m
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Follow-up suggestions */}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {m.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(s)}
                          disabled={isLoading}
                          className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary hover:bg-primary/10 transition cursor-pointer text-left"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {m.role === "user" && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground mt-0.5">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
                <span>Terra is querying n8n and authoritative land records…</span>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={retryLast}
                  disabled={isLoading}
                >
                  Retry
                </Button>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input form */}
          <form
            onSubmit={handleSend}
            className="border-t border-border p-4 bg-surface-elevated flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${activeProperty?.title || "your property"}, trust score, missing documents, or Bhoomi RTC…`}
              className="flex-1 text-xs md:text-sm"
              disabled={isLoading}
              id="assistant-page-input"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} id="assistant-page-send-btn">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Sidebar with Real Dynamic Inquiries and Real User Properties */}
        <div className="space-y-4">
          {/* Dynamic Suggested Inquiries */}
          <div className="surface-card p-5 border border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Suggested Inquiries
            </p>
            <div className="mt-3 space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  disabled={isLoading}
                  className="w-full text-left rounded-lg border border-border p-2.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary inline mr-1.5" />
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* User's Real Registered Parcels */}
          <div className="surface-card p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Registered Parcels
              </p>
              <Badge variant="outline" className="text-[10px] font-mono">
                {userProperties.length}
              </Badge>
            </div>

            {userProperties.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {userProperties.map((p) => {
                  const isSelected = activeProperty?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProperty(p);
                        sendMessage(`Explain verification status and trust score for ${p.title} (${p.passportId})`);
                      }}
                      disabled={isLoading}
                      className={`w-full text-left rounded-lg border p-2.5 text-xs transition cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border hover:border-primary/40 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground truncate max-w-[190px]">{p.title}</p>
                        <span className="text-[10px] font-mono text-primary font-medium">{p.trustScore}/100</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {p.passportId} · {p.region}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                <p>No registered properties found.</p>
                <p className="text-[11px] mt-1">Register a parcel to view live AI verification analytics.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
