import { describe, expect, it } from 'vitest';
import { humanizeAiResponse } from './format';

describe('humanizeAiResponse', () => {
  it('removes bold, italic, code, and heading markers', () => {
    const result = humanizeAiResponse(
      '### **Summary**\n\n**LR4** has `57` components with __replacement__ needs.',
    );

    expect(result).toBe(
      'Summary\n\nLR4 has 57 components with replacement needs.',
    );
  });

  it('converts markdown bullets to plain dash lists', () => {
    const result = humanizeAiResponse(
      '**Rooms with issues:**\n* **LR2** - 1 repair\n+ **LR4** - 57 replacements',
    );

    expect(result).toBe(
      'Rooms with issues:\n- LR2 - 1 repair\n- LR4 - 57 replacements',
    );
  });

  it('removes code fences and blockquote markers', () => {
    const result = humanizeAiResponse(
      '```text\n> Room LR4 has the most issues.\n```',
    );

    expect(result).toBe('Room LR4 has the most issues.');
  });

  it('normalizes smart punctuation and non-breaking spaces', () => {
    const result = humanizeAiResponse(
      'Low\u2011stock item \u201cMON\u2011SAM\u201120\u201d \u2014 1 left.',
    );

    expect(result).toBe('Low-stock item "MON-SAM-20" - 1 left.');
  });

  it('collapses excessive blank lines', () => {
    const result = humanizeAiResponse('First line.\n\n\n\nSecond line.');
    expect(result).toBe('First line.\n\nSecond line.');
  });
});
