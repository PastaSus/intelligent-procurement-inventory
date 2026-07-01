'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Command, Copy, Trash2, MessageCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReorderSuggestion } from '@/components/SuggestionCards';

interface DashboardStats {
  totalInventory: number;
  lowStockCount: number;
  pendingPOs: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export function FullScreenChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with a new conversation
  useEffect(() => {
    if (conversations.length === 0) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [
          {
            id: '1',
            role: 'assistant',
            content: 'Hi! I can help you with inventory insights. What would you like to know?',
            timestamp: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations([newConversation]);
      setCurrentConversation(newConversation);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(!showCommandPalette);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentConversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: new Date(),
    };
    setCurrentConversation(updatedConversation);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        let aiUnavailable = false;
        let errorDetail = '';

        if (response.status === 503) {
          aiUnavailable = true;
          errorDetail = 'AI service is not configured.';
        } else if (response.status === 504) {
          aiUnavailable = true;
          errorDetail = 'AI service took too long to respond.';
        } else if (response.status === 429) {
          aiUnavailable = true;
          errorDetail = 'AI service quota exceeded. Please try again later.';
        }

        const errorBody = await response.json().catch(() => null);
        if (errorBody?.error) {
          errorDetail = errorBody.error;
        }

        // Fetch fallback dashboard stats
        let statsBody = '';
        try {
          const statsRes = await fetch('/api/dashboard');
          if (statsRes.ok) {
            const stats: DashboardStats = await statsRes.json();
            statsBody = `\n\n**Current Inventory:**\n- Total items: ${stats.totalInventory}\n- Low stock items: ${stats.lowStockCount}\n- Pending purchase orders: ${stats.pendingPOs}`;
          }
        } catch {
          // Fallback stats unavailable — skip
        }

        const fallbackContent = aiUnavailable
          ? `**AI is unavailable right now.** ${errorDetail}\n\nBasic inventory metrics are shown below instead.${statsBody}`
          : `Sorry, something went wrong: ${errorDetail || `API error (${response.status})`}${statsBody}`;

        const fallbackConversation = {
          ...updatedConversation,
          messages: [
            ...updatedConversation.messages,
            {
              id: Date.now().toString(),
              role: 'assistant' as const,
              content: fallbackContent,
              timestamp: new Date(),
            },
          ],
        };
        setCurrentConversation(fallbackConversation);
        setConversations((prev) =>
          prev.map((c) => (c.id === fallbackConversation.id ? fallbackConversation : c))
        );
        return;
      }

      const data = await response.json();
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response || 'No response received',
        timestamp: new Date(),
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiMessage],
        updatedAt: new Date(),
      };
      setCurrentConversation(finalConversation);

      // Update conversation in list
      setConversations((prev) =>
        prev.map((c) => (c.id === finalConversation.id ? finalConversation : c))
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred. Please try again.';

      // Fetch fallback dashboard stats on network error too
      let statsBody = '';
      try {
        const statsRes = await fetch('/api/dashboard');
        if (statsRes.ok) {
          const stats: DashboardStats = await statsRes.json();
          statsBody = `\n\n**Current Inventory:**\n- Total items: ${stats.totalInventory}\n- Low stock items: ${stats.lowStockCount}\n- Pending purchase orders: ${stats.pendingPOs}`;
        }
      } catch {
        // Fallback stats unavailable — skip
      }

      const fallbackContent = errorMessage.includes('fetch')
        ? `**AI is unavailable right now.** Network error — could not reach the AI service. Please try again later.${statsBody}`
        : `Sorry, something went wrong: ${errorMessage}${statsBody}`;

      const errorConversation: Conversation = {
        ...updatedConversation,
        messages: [
          ...updatedConversation.messages,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: fallbackContent,
            timestamp: new Date(),
          },
        ],
      };
      setCurrentConversation(errorConversation);
      setConversations((prev) =>
        prev.map((c) => (c.id === errorConversation.id ? errorConversation : c))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: 'Hi! I can help you with inventory insights. What would you like to know?',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
  };

  const handleDeleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    if (currentConversation?.id === id) {
      setCurrentConversation(updated[0] || null);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const filteredConversations = conversations.filter((c) =>
    c.messages.some((m) =>
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No conversations yet</p>
          <button
            onClick={handleNewConversation}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Start a conversation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex gap-6 overflow-hidden">
      {/* Sidebar with conversation history */}
      <div className="w-64 border-r bg-muted/30 flex flex-col overflow-hidden">
        <div className="p-4 space-y-4 border-b">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <button
            onClick={handleNewConversation}
            className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium transition-colors"
          >
            + New Chat
          </button>
        </div>

        {/* Search conversations */}
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Search conversations"
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto space-y-2 p-4">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                currentConversation.id === conv.id
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              }`}
              onClick={() => {
                setCurrentConversation(conv);
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conv.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {conv.messages.length} messages
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AI Chat Assistant</h1>
              <p className="text-muted-foreground">Ask questions about your inventory</p>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Command className="h-4 w-4" />
              <span>Press Ctrl+K for commands</span>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-6"
          role="log"
          aria-label="Chat message history"
          aria-live="polite"
        >
          {currentConversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-6 py-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center justify-between gap-4 mt-2 text-xs opacity-70">
                  <time>{message.timestamp.toLocaleTimeString()}</time>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => handleCopyMessage(message.content)}
                      className="hover:opacity-100 transition-opacity"
                      aria-label="Copy message"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted px-6 py-4 rounded-lg">
                <span className="inline-block animate-pulse">●</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        {/* Input area */}
        <div className="border-t p-6 space-y-4">
          {/* Suggested prompts */}
          {currentConversation.messages.length <= 1 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Suggested prompts:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'What should I reorder?',
                  'Show low stock items',
                  'Total inventory count',
                  'Vendor information',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      inputRef.current?.focus();
                    }}
                    className="text-sm p-2 border rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about inventory..."
              className="flex-1 px-4 py-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              aria-label="Chat message input"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              aria-label="Send message"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Command Palette */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
          <div className="bg-card rounded-lg border shadow-lg w-full max-w-lg p-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Commands</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleNewConversation();
                    setShowCommandPalette(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-muted rounded-lg transition-colors text-sm"
                >
                  New conversation
                </button>
                <button
                  onClick={() => {
                    inputRef.current?.focus();
                    setShowCommandPalette(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-muted rounded-lg transition-colors text-sm"
                >
                  Focus input
                </button>
                <button
                  onClick={() => setShowCommandPalette(false)}
                  className="w-full text-left px-4 py-2 hover:bg-muted rounded-lg transition-colors text-sm"
                >
                  Close (Esc)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
