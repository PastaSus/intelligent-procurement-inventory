'use client';

import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';
  const Icon = isUser ? User : Bot;

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      role="article"
      aria-label={`${role === 'user' ? 'Your' : 'Assistant'} message: ${content}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      {/* Message bubble */}
      <div className={`flex flex-col gap-1 max-w-xs ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2 rounded-lg ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-none'
              : 'bg-muted text-foreground rounded-bl-none'
          }`}
        >
          <p className="text-sm break-words">{content}</p>
        </div>
        <time className="text-xs text-muted-foreground">
          {timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </time>
      </div>
    </div>
  );
}
