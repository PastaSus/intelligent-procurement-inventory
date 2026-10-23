export type ChatRole = 'user' | 'assistant';

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export const MAX_CHAT_MESSAGES = 8;
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_TOTAL_LENGTH = 6000;

export function normalizeChatMessages(body: unknown): ChatTurn[] {
  if (!body || typeof body !== 'object') return [];

  const record = body as Record<string, unknown>;
  let candidates: unknown[] = [];

  if (Array.isArray(record.messages) && record.messages.length > 0) {
    candidates = record.messages;
  } else {
    if (Array.isArray(record.history)) {
      candidates = [...record.history];
    }
    if (typeof record.message === 'string') {
      candidates.push({ role: 'user', content: record.message });
    }
  }

  const normalized: ChatTurn[] = [];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;

    const { role, content } = candidate as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string') continue;

    const trimmed = content.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (trimmed.length > 0) {
      normalized.push({ role, content: trimmed });
    }
  }

  const recent = normalized.slice(-MAX_CHAT_MESSAGES);
  const result: ChatTurn[] = [];
  let totalLength = 0;

  for (let index = recent.length - 1; index >= 0; index -= 1) {
    const message = recent[index];
    if (
      result.length > 0 &&
      totalLength + message.content.length > MAX_TOTAL_LENGTH
    ) {
      break;
    }

    result.unshift(message);
    totalLength += message.content.length;
  }

  return result;
}
