import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatMessage } from './ChatMessage';

describe('ChatMessage Component', () => {
  const mockTimestamp = new Date('2026-05-13T10:30:00');

  describe('User Message Rendering', () => {
    it('should render user message with correct styling', () => {
      render(
        <ChatMessage
          role="user"
          content="What is the current inventory level?"
          timestamp={mockTimestamp}
        />
      );

      const message = screen.getByText('What is the current inventory level?');
      expect(message).toBeInTheDocument();
    });

    it('should render user avatar icon', () => {
      render(
        <ChatMessage
          role="user"
          content="Test message"
          timestamp={mockTimestamp}
        />
      );

      const avatar = screen.getByLabelText(/Your message/i);
      expect(avatar).toBeInTheDocument();
    });

    it('should position user message on the right side', () => {
      const { container } = render(
        <ChatMessage
          role="user"
          content="Right aligned message"
          timestamp={mockTimestamp}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('flex-row-reverse');
    });
  });

  describe('Assistant Message Rendering', () => {
    it('should render assistant message with correct styling', () => {
      render(
        <ChatMessage
          role="assistant"
          content="The current inventory level is 500 units."
          timestamp={mockTimestamp}
        />
      );

      const message = screen.getByText('The current inventory level is 500 units.');
      expect(message).toBeInTheDocument();
    });

    it('should render bot avatar icon for assistant', () => {
      render(
        <ChatMessage
          role="assistant"
          content="Bot response"
          timestamp={mockTimestamp}
        />
      );

      const avatar = screen.getByLabelText(/Assistant message/i);
      expect(avatar).toBeInTheDocument();
    });

    it('should position assistant message on the left side', () => {
      const { container } = render(
        <ChatMessage
          role="assistant"
          content="Left aligned message"
          timestamp={mockTimestamp}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('flex-row');
    });
  });

  describe('Timestamp Display', () => {
    it('should format timestamp correctly', () => {
      render(
        <ChatMessage
          role="user"
          content="Test"
          timestamp={mockTimestamp}
        />
      );

      const timeElement = screen.getByText(/10:30/i);
      expect(timeElement).toBeInTheDocument();
    });

    it('should render timestamp with correct element type', () => {
      render(
        <ChatMessage
          role="user"
          content="Test"
          timestamp={mockTimestamp}
        />
      );

      const timeElement = screen.getByText(/10:30/i);
      expect(timeElement.tagName).toBe('TIME');
    });
  });

  describe('Accessibility', () => {
    it('should have proper role attribute', () => {
      render(
        <ChatMessage
          role="user"
          content="Accessible message"
          timestamp={mockTimestamp}
        />
      );

      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });

    it('should have aria-label with message content', () => {
      render(
        <ChatMessage
          role="user"
          content="My test message"
          timestamp={mockTimestamp}
        />
      );

      const article = screen.getByRole('article');
      expect(article.getAttribute('aria-label')).toContain('My test message');
    });
  });

  describe('Long Content Handling', () => {
    it('should handle long content without truncation', () => {
      const longContent = 'A'.repeat(300);
      render(
        <ChatMessage
          role="assistant"
          content={longContent}
          timestamp={mockTimestamp}
        />
      );

      const message = screen.getByText(longContent);
      expect(message).toBeInTheDocument();
    });
  });
});