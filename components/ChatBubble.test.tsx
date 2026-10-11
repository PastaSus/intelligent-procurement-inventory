import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act } from 'react';
import { ChatBubble } from './ChatBubble';

describe('ChatBubble dock toggle', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('docks right by default', () => {
    render(<ChatBubble />);

    expect(screen.getByRole('button', { name: 'Open chat' }).className).toContain('right-6');
  });

  it('moves bubble left via header toggle and persists choice', async () => {
    const user = userEvent.setup();
    render(<ChatBubble />);

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    await user.click(screen.getByRole('button', { name: 'Dock chat to left' }));

    expect(screen.getByRole('button', { name: 'Close chat' }).className).toContain('left-6');
    expect(screen.getByRole('button', { name: 'Dock chat to left' })).toHaveAttribute('aria-pressed', 'true');
    expect(window.localStorage.getItem('ai-chat-bubble-side')).toBe('left');
  });

  it('restores dock side from storage on mount', () => {
    window.localStorage.setItem('ai-chat-bubble-side', 'left');
    render(<ChatBubble />);

    expect(screen.getByRole('button', { name: 'Open chat' }).className).toContain('left-6');
  });

  it('recovers stored side after SSR hydration ships the default', async () => {
    // Server prerender has no storage: always ships right-6.
    window.localStorage.clear();
    const ssrHtml = renderToString(<ChatBubble />);
    expect(ssrHtml).toContain('right-6');

    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = ssrHtml;
    // Client boots with a stored preference, then hydrates mismatched HTML.
    window.localStorage.setItem('ai-chat-bubble-side', 'left');
    await act(async () => {
      hydrateRoot(container, <ChatBubble />);
    });

    expect(screen.getByRole('button', { name: 'Open chat' }).className).toContain('left-6');
    container.remove();
  });
});
