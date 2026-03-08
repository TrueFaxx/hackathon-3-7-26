"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { chat } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsLoading(true);

    try {
      const res = await chat(msg);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="max-w-3xl w-full mx-auto flex flex-col flex-1">
        {/* Header */}
        <div className="py-6 border-b border-border">
          <h1 className="text-2xl font-bold text-text">Chat</h1>
          <p className="text-sm text-text-secondary mt-1">
            Ask about security best practices, code review, vulnerabilities, or your project.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-text-muted text-sm mb-6">No messages yet. Try asking something like:</p>
                <div className="space-y-2">
                  {[
                    "What are common SQL injection patterns?",
                    "How should I handle JWT token refresh securely?",
                    "Review this auth middleware approach for security issues",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="block w-full text-left text-sm text-text-secondary bg-surface border border-border px-4 py-3 hover:border-border-strong hover:text-text transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 bg-primary flex items-center justify-center text-[10px] font-bold text-text-inverse shrink-0 mt-0.5">
                  GG
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-text-inverse"
                    : "bg-surface border border-border text-text"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="chat-markdown">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 bg-accent flex items-center justify-center text-[10px] font-bold text-text-inverse shrink-0 mt-0.5">
                  You
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 bg-primary flex items-center justify-center text-[10px] font-bold text-text-inverse shrink-0 mt-0.5">
                GG
              </div>
              <div className="bg-surface border border-border px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-text-muted animate-typing" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-text-muted animate-typing" style={{ animationDelay: "200ms" }} />
                  <span className="w-2 h-2 bg-text-muted animate-typing" style={{ animationDelay: "400ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="py-4 border-t border-border">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about security, code review, or your project..."
              rows={1}
              className="flex-1 bg-surface border border-border px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none transition-colors"
              style={{ minHeight: "42px", maxHeight: "120px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-text-inverse text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>
          <p className="text-[11px] text-text-muted mt-2">
            Powered by Claude. Shift+Enter for new line.
          </p>
        </div>
      </div>
    </div>
  );
}
