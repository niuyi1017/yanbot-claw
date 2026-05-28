import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

export default function SearchPage() {
  return (
    <>
      <PageHeader title="AI 检索" description="用自然语言检索考研资讯、院校、调剂" />
      <EmptyState
        title="敬请期待"
        description="下一期接入 LLM + yanbot Open API，实现自然语言到结构化查询的转换"
      />
    </>
  );
}
