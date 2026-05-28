import Link from "next/link";
import { Search, GraduationCap, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TOOLS = [
  {
    href: "/tools/search",
    icon: Search,
    title: "AI 检索",
    desc: "用自然语言检索考研资讯、院校、调剂信息",
  },
  {
    href: "/tools/school-report",
    icon: GraduationCap,
    title: "择校报告",
    desc: "根据考生情况与历年上岸数据，生成定制化择校建议",
  },
  {
    href: "/tools/content",
    icon: Wand2,
    title: "内容生成",
    desc: "一键生成小红书图文与短视频脚本",
  },
];

export default function HomePage() {
  return (
    <>
      <PageHeader title="工作台" description="选择一个 AI 工具开始工作，或直接进入 Agent 对话" />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map(({ href, icon: Icon, title, desc }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-colors group-hover:border-foreground/30">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">最近会话</h2>
        <EmptyState title="暂无会话" description="进入 Agent 对话页发起第一条消息" />
      </section>
    </>
  );
}
