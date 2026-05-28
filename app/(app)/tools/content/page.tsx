import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

export default function ContentPage() {
  return (
    <>
      <PageHeader title="内容生成" description="基于站内数据生成小红书图文 / 短视频脚本" />
      <EmptyState
        title="敬请期待"
        description="下一期支持选取 feed → LLM 输出图文标题/正文/标签 + 60s 视频脚本"
      />
    </>
  );
}
