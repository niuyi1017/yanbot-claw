import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

export default function SchoolReportPage() {
  return (
    <>
      <PageHeader
        title="择校报告"
        description="基于考生情况与历年上岸数据，生成结构化择校建议"
      />
      <EmptyState
        title="敬请期待"
        description="下一期接入历年录取数据 + LLM 生成 Markdown 报告"
      />
    </>
  );
}
