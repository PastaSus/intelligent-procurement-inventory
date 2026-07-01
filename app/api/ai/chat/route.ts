import { NextRequest, NextResponse } from 'next/server';
import { getLabContext, callGroq, validateApiKey } from '@/lib/ai/groq';

export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'AI service not configured. Please contact your administrator.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const context = await getLabContext();
    const response = await callGroq(message.trim(), context, apiKey);

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

    if (errorMessage.includes('429') || errorMessage.includes('quota')) {
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
