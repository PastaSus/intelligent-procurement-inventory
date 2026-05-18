import { prisma } from "@/lib/prisma";

export interface ChatMessageType {
  role: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: Date;
}

export interface ChatConversationType {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  messages: ChatMessageType[];
}

export async function createConversation(title: string, userId?: string) {
  return prisma.chatConversation.create({
    data: {
      title,
      user_id: userId || null,
    },
  });
}

export async function getConversation(id: string) {
  return prisma.chatConversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { timestamp: 'asc' },
      },
    },
  });
}

export async function getAllConversations(userId?: string) {
  return prisma.chatConversation.findMany({
    where: {
      deleted: false,
      ...(userId ? { user_id: userId } : {}),
    },
    include: {
      messages: {
        orderBy: { timestamp: 'asc' },
        take: 1,
      },
    },
    orderBy: { updated_at: 'desc' },
  });
}

export async function addMessage(
  conversationId: string,
  role: 'USER' | 'ASSISTANT',
  content: string
) {
  const [message] = await Promise.all([
    prisma.chatMessage.create({
      data: {
        conversation_id: conversationId,
        role,
        content,
      },
    }),
    prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    }),
  ]);

  return message;
}

export async function updateConversationTitle(id: string, title: string) {
  return prisma.chatConversation.update({
    where: { id },
    data: { title },
  });
}

export async function deleteConversation(id: string) {
  return prisma.chatConversation.update({
    where: { id },
    data: { deleted: true },
  });
}

export function generateTitleFromMessage(firstMessage: string): string {
  const preview = firstMessage.slice(0, 50);
  if (firstMessage.length > 50) {
    return `${preview}...`;
  }
  return preview;
}