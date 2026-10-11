"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ArrowLeft, ArrowRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type DockSide = "left" | "right";

const DOCK_STORAGE_KEY = "ai-chat-bubble-side";

function getInitialSide(): DockSide {
  if (typeof window === "undefined") return "right";
  try {
    return window.localStorage.getItem(DOCK_STORAGE_KEY) === "left"
      ? "left"
      : "right";
  } catch {
    return "right";
  }
}

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  // Always start on the server-rendered default; the stored side is applied
  // in the mount effect below. Reading storage in the initializer causes a
  // hydration mismatch whose stale server class React never patches.
  const [side, setSide] = useState<DockSide>("right");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I can help you with lab asset insights. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const didMountPersist = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Re-sync after hydration: the server prerender always ships the default
  // side, so the hydrated button class can be stale. Reading storage on
  // mount forces a re-render that patches the positioning classes.
  useEffect(() => {
    setSide(getInitialSide());
  }, []);

  // Persist dock side so the bubble stays out of the user's way.
  // Skips the mount run so a stale hydrated state can never clobber storage.
  useEffect(() => {
    if (!didMountPersist.current) {
      didMountPersist.current = true;
      return;
    }
    try {
      window.localStorage.setItem(DOCK_STORAGE_KEY, side);
    } catch {
      // Storage unavailable — side still applies for this session
    }
  }, [side]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage: Message = {
        role: "assistant",
        content: data.response || "No response received",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, something went wrong: ${errorMessage}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Dark overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-110 transition-transform ${side === "right" ? "right-6" : "left-6"}`}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
        aria-controls="chat-popup"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div
          id="chat-popup"
          className={`fixed bottom-36 z-40 w-96 max-w-[calc(100vw-2rem)] rounded-lg border bg-card shadow-lg flex flex-col h-[500px] ${side === "right" ? "right-6" : "left-6"}`}
        >
          {/* Header */}
          <div className="border-b p-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">
                Ask about your lab assets
              </p>
            </div>
            <div className="flex items-center gap-1" role="group" aria-label="Dock chat bubble">
              <button
                type="button"
                onClick={() => setSide("left")}
                aria-label="Dock chat to left"
                aria-pressed={side === "left"}
                title="Dock to left"
                className={`p-1.5 rounded-md transition-colors ${side === "left" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSide("right")}
                aria-label="Dock chat to right"
                aria-pressed={side === "right"}
                title="Dock to right"
                className={`p-1.5 rounded-md transition-colors ${side === "right" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages container */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            role="log"
            aria-label="Chat message history"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.timestamp.getTime()}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-3 py-2 rounded-lg text-sm">
                  <span className="inline-block animate-pulse">●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {/* Input area */}
          <div className="border-t p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about lab assets..."
                className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Chat message input"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
