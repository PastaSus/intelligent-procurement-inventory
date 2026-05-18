'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const STORAGE_KEY = 'ai-chat-messages';

const initialMessage: Message = {
  role: 'assistant',
  content: 'Hi! I can help you with inventory insights. What would you like to know?',
  timestamp: new Date().toISOString(),
};

function getInitialMessages(): Message[] {
  if (typeof window === 'undefined') return [initialMessage];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('Loaded messages from localStorage:', parsed.length);
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load messages:', e);
  }
  return [initialMessage];
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save to localStorage whenever messages change
  useEffect(() => {
    console.log('Saving messages:', messages.length);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage: Message = {
        role: 'assistant',
        content: data.response || 'No response received',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, something went wrong: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([initialMessage]);
  };

  return (
    <section
      className="flex flex-col h-full max-h-[600px] rounded-lg border bg-card shadow-sm"
      aria-label="AI Chat Assistant"
    >
      <div className="border-b p-4 flex flex-row items-center justify-between">
        <div>
          <h3 className="font-semibold">AI Assistant</h3>
          <p className="text-sm text-muted-foreground">Ask questions about your inventory</p>
        </div>
        <button
          onClick={handleClearChat}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Clear chat history"
          title="Clear chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-label="Chat message history" aria-live="polite">
        {messages.map((message, index) => (
          <ChatMessage
            key={`${message.timestamp}-${index}`}
            role={message.role}
            content={message.content}
            timestamp={new Date(message.timestamp)}
          />
        ))}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      <ChatInput input={input} onInputChange={setInput} onSend={handleSend} isLoading={isLoading} />
    </section>
  );
}