import { NextRequest, NextResponse } from 'next/server';
import { addMessage } from '@/lib/chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, role, content } = body;

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: 'conversationId, role, and content are required' },
        { status: 400 }
      );
    }

    if (role !== 'USER' && role !== 'ASSISTANT') {
      return NextResponse.json(
        { error: 'role must be USER or ASSISTANT' },
        { status: 400 }
      );
    }

    const message = await addMessage(conversationId, role, content);
    return NextResponse.json(message);
  } catch (error) {
    console.error('Chat message API error:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}