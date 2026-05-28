"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { MessageInput } from "@/components/chat/message-input";
import { MessageList, type ChatMessage } from "@/components/chat/message-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "sonner";

// MVP: simple echo wiring. Next iteration: swap to `useChat` from `@ai-sdk/react`
// pointing at /api/conversations/[id]/messages with streamText on the server.
export default function AgentPage() {
  const [conversationId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);

  async function send(text: string) {
    const user: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, user]);
    setPending(true);
    try {
      const res = await api<{ reply: string }>(
        `/api/conversations/${conversationId}/messages`,
        { method: "POST", body: JSON.stringify({ text }) }
      );
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: res.reply },
      ]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "发送失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem-3rem)] flex-col">
      <PageHeader title="Agent 对话" description="统一对话入口，未来按意图调用 3 个工具" />
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border">
        <ScrollArea className="flex-1">
          <MessageList messages={messages} />
        </ScrollArea>
        <MessageInput disabled={pending} onSubmit={send} />
      </div>
    </div>
  );
}
