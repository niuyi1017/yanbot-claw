"use client";

import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        从下方输入框开始一段对话
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={cn(
            "flex",
            m.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          <div
            className={cn(
              "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            )}
          >
            {m.content}
          </div>
        </div>
      ))}
    </div>
  );
}
