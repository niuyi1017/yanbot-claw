"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Search,
  GraduationCap,
  Wand2,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "工作台", icon: LayoutDashboard },
  { href: "/agent", label: "Agent 对话", icon: MessageSquare },
  { href: "/tools/search", label: "AI 检索", icon: Search },
  { href: "/tools/recommend", label: "志愿推荐", icon: ListChecks },
  { href: "/tools/school-report", label: "择校报告", icon: GraduationCap },
  { href: "/tools/content", label: "内容生成", icon: Wand2 },
];

export function AppSider() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r">
      <nav className="flex flex-col gap-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
