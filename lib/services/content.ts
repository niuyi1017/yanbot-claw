import type { ContentInput } from "@/types/api";
import type { ContentDraft } from "@/types/domain";

export async function generateContent(input: ContentInput): Promise<ContentDraft> {
  const kind = input.format;
  return {
    kind,
    title: kind === "xhs" ? "[mock] 小红书标题占位" : "[mock] 视频脚本标题占位",
    body: "占位正文 / 脚本，下一期接入站内数据 + LLM。",
    tags: ["考研", "mock"],
  };
}
