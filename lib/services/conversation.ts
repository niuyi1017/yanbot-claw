import type { ConversationMeta } from "@/types/api";

// In-memory placeholder. Replace with persistence (SQLite/Mongo) later.
const conversations: ConversationMeta[] = [];

export function listConversations(): ConversationMeta[] {
  return conversations;
}

export function createConversation(title: string): ConversationMeta {
  const meta: ConversationMeta = {
    id: crypto.randomUUID(),
    title,
    createdAt: new Date().toISOString(),
  };
  conversations.unshift(meta);
  return meta;
}

export function echoMessage(text: string): string {
  return `echo: ${text}`;
}
