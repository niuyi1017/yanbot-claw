import type { SearchInput } from "@/types/api";
import type { FeedListData } from "@/types/domain";

// MVP mock. Future: NL → query plan → getYanbotClient().get('/open/feed/list', ...).
export async function search(input: SearchInput): Promise<FeedListData> {
  return {
    list: [
      {
        id: "mock-1",
        title: `[mock] 检索结果占位 - ${input.query}`,
        publicDate: new Date().toISOString(),
        tags: ["mock"],
      },
    ],
    total: 1,
  };
}
