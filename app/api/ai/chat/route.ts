import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { chatWithAi, validateApiKey } from '@/lib/ai';
import { normalizeChatMessages } from '@/lib/ai/messages';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!validateApiKey(geminiKey) && !validateApiKey(groqKey)) {
      return NextResponse.json(
        { error: 'AI service not configured. Please contact your administrator.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const messages = normalizeChatMessages(body);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (messages[messages.length - 1].role !== 'user') {
      return NextResponse.json(
        { error: 'The last message must be from the user' },
        { status: 400 }
      );
    }

    const response = await chatWithAi(messages, {
      gemini: geminiKey,
      groq: groqKey,
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }

    if (errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('overloaded')) {
      return NextResponse.json(
        { error: 'AI service is temporarily busy. Please try again.' },
        { status: 503 }
      );
    }

    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'AI service quota exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    if (errorMessage.includes('content_filter') || errorMessage.includes('truncated') || errorMessage.includes('Empty response')) {
      return NextResponse.json(
        { error: 'Unable to process request. Please try a different question.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}
