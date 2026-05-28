import type { SchoolReportInput } from "@/types/api";
import type { SchoolReport } from "@/types/domain";

export async function generateSchoolReport(input: SchoolReportInput): Promise<SchoolReport> {
  return {
    schoolName: input.candidate.target ?? "未填写目标院校",
    major: input.candidate.major ?? "未填写专业",
    summary: "[mock] 此为占位择校报告，下一期接入历年录取数据与 LLM 生成。",
    fitScore: 0,
    sections: [
      { title: "院校概况", body: "占位" },
      { title: "近三年录取分析", body: "占位" },
      { title: "建议", body: "占位" },
    ],
    dataSource: "mock",
  };
}
