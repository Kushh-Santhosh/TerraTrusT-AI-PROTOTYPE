import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Bot, User as UserIcon, FileBadge } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { answer, type AssistantResponse } from "@/lib/assistant-brain";
import { properties } from "@/lib/mock-data";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — TerraTrust AI" }] }),
  component: AssistantPage,
});

type Msg =
  | { role: "user"; text: string }
  | { role: "assistant"; reply: AssistantResponse };

const seed: Msg[] = [
  { role: "assistant", reply: {
    text: `Namaste — I'm **Terra**, your Indian property intelligence assistant. I'm grounded in real verification workflows: trust scores, fraud forensic checks, sub-registrar valuations, and Bhoomi cadastral records. Pick a question below or enter your inquiry.`,
    suggestions: [
      "What's the trust score on my Bengaluru property?",
      "Any fraud signals on my portfolio?",
      "What documents am I missing for Mysuru farm?",
      "Estimate the value of my Bengaluru residence",
    ],
  } },
];

const examplePrompts = [
  "Why is my Mysuru farm confidence below 80?",
  "Walk me through the next step for the Gurugram plot",
  "Any encumbrances on Indiranagar Residence?",
  "How was the AI valuation calculated for Pune compound?",
];

function AssistantPage() {
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = (t: string) => {
    const text = t.trim();
    if (!text || busy) return;
    setMsgs(m => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    // small simulated latency to feel grounded, not instant
    setTimeout(() => {
      const reply = answer(text);
      setMsgs(m => [...m, { role: "assistant", reply }]);
      setBusy(false);
    }, 380);
  };

  return (
    <AppShell title="AI Assistant" subtitle="Ask grounded questions across your land records, valuations, and verification pipelines.">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="surface-card flex h-[72vh] flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {msgs.map((m, i) => (
              <div key={i} className={`flex items-start gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className={`max-w-xl space-y-3 rounded-2xl p-4 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-surface border border-border text-foreground"
                }`}>
                  {m.role === "user" ? (
                    <p>{m.text}</p>
                  ) : (
                    <>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{m.reply.text}</ReactMarkdown>
                      </div>
                      {m.reply.citations && m.reply.citations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
                          {m.reply.citations.map((c, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                              <FileBadge className="h-3 w-3" /> {c.label} {c.passportId && `(${c.passportId})`}
                            </span>
                          ))}
                        </div>
                      )}
                      {m.reply.suggestions && m.reply.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {m.reply.suggestions.map((s, idx) => (
                            <button
                              key={idx}
                              onClick={() => send(s)}
                              className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary hover:bg-primary/10 transition cursor-pointer"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
                <span>Terra is analyzing land intelligence records…</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Prompt input */}
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            className="border-t border-border p-4 bg-surface-elevated flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about trust scores, guideline valuations, missing deeds, or dispute status…"
              className="flex-1"
            />
            <Button type="submit" disabled={busy || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Prompts drawer */}
        <div className="space-y-4">
          <div className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested Inquiries</p>
            <div className="mt-3 space-y-2">
              {examplePrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => send(p)}
                  className="w-full text-left rounded-lg border border-border p-2.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary inline mr-1.5" />
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Land Parcels</p>
            <div className="mt-3 space-y-2">
              {properties.map(p => (
                <button
                  key={p.id}
                  onClick={() => send(`Explain trust score and risk indicators for ${p.title} (${p.passportId})`)}
                  className="w-full text-left rounded-lg border border-border p-2 text-xs hover:border-primary/40 transition cursor-pointer"
                >
                  <p className="font-semibold text-foreground truncate">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{p.passportId} · {p.region}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
