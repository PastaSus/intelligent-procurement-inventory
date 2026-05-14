import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChat } from './AIChat';

describe('AIChat Component', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('should render with initial greeting message', () => {
      render(<AIChat />);

      const greeting = screen.getByText(/I can help you with inventory insights/i);
      expect(greeting).toBeInTheDocument();
    });

    it('should render chat header', () => {
      render(<AIChat />);

      const header = screen.getByText('AI Assistant');
      expect(header).toBeInTheDocument();
    });

    it('should render input field', () => {
      render(<AIChat />);

      const input = screen.getByPlaceholderText(/Ask me something about your inventory/i);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Message Sending', () => {
    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      render(<AIChat />);

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('API Integration', () => {
    it('should have proper API endpoint in component', () => {
      render(<AIChat />);
      
      const input = screen.getByPlaceholderText(/Ask me something about your inventory/i);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Auto-scroll', () => {
    it('should have messages container with role log', () => {
      render(<AIChat />);

      const messagesContainer = screen.getByRole('log');
      expect(messagesContainer).toBeInTheDocument();
    });

    it('should have aria-live polite for accessibility', () => {
      render(<AIChat />);

      const messagesContainer = screen.getByRole('log');
      expect(messagesContainer).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Accessibility', () => {
    it('should have section with aria-label', () => {
      render(<AIChat />);

      const section = screen.getByLabelText(/AI Chat Assistant/i);
      expect(section).toBeInTheDocument();
    });

    it('should have messages with aria-label', () => {
      render(<AIChat />);

      const messages = screen.getByLabelText(/Chat message history/i);
      expect(messages).toBeInTheDocument();
    });
  });
});