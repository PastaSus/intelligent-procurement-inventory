import { NextRequest, NextResponse } from 'next/server';
import { 
  createConversation, 
  getAllConversations, 
  getConversation, 
  addMessage,
  updateConversationTitle,
  deleteConversation,
  generateTitleFromMessage
} from '@/lib/chat';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('id');

    if (conversationId) {
      const conversation = await getConversation(conversationId);
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(conversation);
    }

    const conversations = await getAllConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    let conversation;

    if (conversationId) {
      conversation = await getConversation(conversationId);
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      conversation = await createConversation(
        generateTitleFromMessage(message)
      );
    }

    await addMessage(conversation.id, 'USER', message);

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title } = body;

    if (!id || !title) {
      return NextResponse.json(
        { error: 'ID and title are required' },
        { status: 400 }
      );
    }

    const conversation = await updateConversationTitle(id, title);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await deleteConversation(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}