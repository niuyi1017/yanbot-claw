import { PageHeader } from "@/components/common/page-header";
import { VibeChat } from "@/components/school-report/vibe-chat";

export default function SchoolReportPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem-3rem)] flex-col">
      <PageHeader
        title="择校报告"
        description="告诉我你的考研情况，AI 自主规划并输出个性化择校报告"
      />
      <VibeChat />
    </div>
  );
}
