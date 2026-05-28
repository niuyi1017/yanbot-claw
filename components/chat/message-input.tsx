"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MessageInput({
  disabled,
  onSubmit,
}: {
  disabled?: boolean;
  onSubmit: (text: string) => void | Promise<void>;
}) {
  const [text, setText] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    await onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-3">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="输入消息，回车发送"
        disabled={disabled}
        autoComplete="off"
      />
      <Button type="submit" size="icon" disabled={disabled || !text.trim()} aria-label="发送">
        <Send />
      </Button>
    </form>
  );
}
