import { describe, expect, it } from 'vitest';
import {
  MAX_CHAT_MESSAGES,
  MAX_MESSAGE_LENGTH,
  normalizeChatMessages,
} from './messages';

describe('normalizeChatMessages', () => {
  it('returns an empty list for invalid input', () => {
    expect(normalizeChatMessages(null)).toEqual([]);
    expect(normalizeChatMessages('hello')).toEqual([]);
    expect(normalizeChatMessages({})).toEqual([]);
  });

  it('normalizes valid message arrays and filters invalid entries', () => {
    const result = normalizeChatMessages({
      messages: [
        { role: 'assistant', content: '  Hello  ' },
        { role: 'system', content: 'ignored' },
        { role: 'user', content: '   ' },
        { role: 'user', content: 'Show low stock' },
      ],
    });

    expect(result).toEqual([
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Show low stock' },
    ]);
  });

  it('supports the legacy message and history fields', () => {
    const result = normalizeChatMessages({
      history: [{ role: 'assistant', content: 'Earlier answer' }],
      message: 'New question',
    });

    expect(result).toEqual([
      { role: 'assistant', content: 'Earlier answer' },
      { role: 'user', content: 'New question' },
    ]);
  });

  it('keeps only the most recent messages', () => {
    const messages = Array.from({ length: MAX_CHAT_MESSAGES + 3 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `message ${index}`,
    }));

    const result = normalizeChatMessages({ messages });

    expect(result).toHaveLength(MAX_CHAT_MESSAGES);
    expect(result[0].content).toBe('message 3');
    expect(result[result.length - 1].content).toBe(
      `message ${MAX_CHAT_MESSAGES + 2}`,
    );
  });

  it('truncates individual messages', () => {
    const result = normalizeChatMessages({
      messages: [{ role: 'user', content: 'x'.repeat(MAX_MESSAGE_LENGTH + 50) }],
    });

    expect(result[0].content).toHaveLength(MAX_MESSAGE_LENGTH);
  });
});
