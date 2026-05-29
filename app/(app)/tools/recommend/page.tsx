"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RecommendResult, Recommendation } from "@/types/domain";

const schema = z.object({
  score: z.coerce.number().int().min(0).max(750, "分数不超过750"),
  subjectGroup: z.enum(["physics", "history"]),
  cityPrefs: z.string().optional(),
  schoolTags: z.object({
    "985": z.boolean().default(false),
    "211": z.boolean().default(false),
    public: z.boolean().default(false),
  }),
  majorKeywords: z.string().optional(),
  gender: z.enum(["", "M", "F"]).default(""),
});

type FormValues = z.infer<typeof schema>;

const TIER_STYLE = {
  reach: { bg: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-700", label: "冲" },
  match: { bg: "bg-blue-50 border-blue-200", badge: "bg-blue-100 text-blue-700", label: "稳" },
  safety: { bg: "bg-green-50 border-green-200", badge: "bg-green-100 text-green-700", label: "保" },
};

const PROB_STYLE: Record<string, string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-orange-100 text-orange-700",
};
const PROB_LABEL: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

function SchoolCard({ item }: { item: Recommendation }) {
  const diffSign = item.scoreDiff >= 0 ? "+" : "";
  return (
    <div className="rounded-lg border bg-background p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{item.schoolName}</p>
          {item.schoolCity && (
            <p className="text-xs text-muted-foreground">{item.schoolCity}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-1 shrink-0">
          {item.schoolTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{item.majorName}</p>

      <div className="flex items-center gap-3 text-sm">
        <span className="font-semibold">{item.minScore} 分</span>
        <span
          className={cn(
            "text-xs font-medium",
            item.scoreDiff >= 0 ? "text-green-600" : "text-orange-600",
          )}
        >
          {diffSign}{item.scoreDiff}
        </span>
        <span
          className={cn(
            "ml-auto inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
            PROB_STYLE[item.admitProbability],
          )}
        >
          录取概率 {PROB_LABEL[item.admitProbability]}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{item.reason}</p>
    </div>
  );
}

export default function RecommendPage() {
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subjectGroup: "physics",
      schoolTags: { "985": false, "211": false, public: false },
      gender: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    try {
      const tags = Object.entries(values.schoolTags)
        .filter(([, v]) => v)
        .map(([k]) => k as "985" | "211" | "public");

      const body = {
        score: values.score,
        subjectGroup: values.subjectGroup,
        ...(values.cityPrefs?.trim() && {
          cityPrefs: values.cityPrefs.split(/[，,、\s]+/).filter(Boolean),
        }),
        ...(tags.length && { schoolTags: tags }),
        ...(values.majorKeywords?.trim() && {
          majorKeywords: values.majorKeywords.split(/[，,、\s]+/).filter(Boolean),
        }),
        ...(values.gender && { gender: values.gender }),
      };

      const res = await fetch("/api/tools/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.code !== 0) throw new Error(json.message ?? "请求失败");
      setResult(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="志愿推荐"
        description="根据分数和选科组合，按冲/稳/保三档推荐学校与专业"
      />

      <div className="space-y-8">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">填写考生信息</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Row 1: score + subjectGroup */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="score">
                    高考分数 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="score"
                    type="number"
                    placeholder="如：580"
                    {...form.register("score")}
                  />
                  {form.formState.errors.score && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.score.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>
                    选科组合 <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    {(["physics", "history"] as const).map((sg) => {
                      const checked = form.watch("subjectGroup") === sg;
                      return (
                        <button
                          key={sg}
                          type="button"
                          onClick={() => form.setValue("subjectGroup", sg)}
                          className={cn(
                            "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-background hover:bg-accent",
                          )}
                        >
                          {sg === "physics" ? "物理组合" : "历史组合"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 2: cityPrefs + majorKeywords */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cityPrefs">偏好城市/省份（可选）</Label>
                  <Input
                    id="cityPrefs"
                    placeholder="如：北京、上海（逗号分隔）"
                    {...form.register("cityPrefs")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="majorKeywords">意向专业关键词（可选）</Label>
                  <Input
                    id="majorKeywords"
                    placeholder="如：计算机、金融（逗号分隔）"
                    {...form.register("majorKeywords")}
                  />
                </div>
              </div>

              {/* Row 3: schoolTags + gender */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>院校标签（可选）</Label>
                  <div className="flex gap-4">
                    {(["985", "211", "public"] as const).map((tag) => (
                      <label key={tag} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          {...form.register(`schoolTags.${tag}`)}
                          className="rounded border-input"
                        />
                        {tag === "public" ? "公办" : tag}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    考生性别（可选）
                  </Label>
                  <p className="text-xs text-muted-foreground -mt-0.5">
                    仅用于个性化排序，不限制可选专业
                  </p>
                  <div className="flex gap-2">
                    {(["", "M", "F"] as const).map((g) => {
                      const checked = form.watch("gender") === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => form.setValue("gender", g)}
                          className={cn(
                            "rounded-md border px-3 py-1.5 text-sm transition-colors",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-background hover:bg-accent",
                          )}
                        >
                          {g === "" ? "不填" : g === "M" ? "男" : "女"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "推荐中…" : "开始推荐"}
              </Button>
            </form>

            {error && (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                {result.candidate.score} 分 ·{" "}
                {result.candidate.subjectGroup === "physics" ? "物理组合" : "历史组合"}
              </span>
              <span>共找到 {result.meta.totalCandidates} 条候选数据</span>
              {result.meta.relaxed?.length ? (
                <span className="text-orange-500">
                  已放宽：{result.meta.relaxed.join("、")}
                </span>
              ) : null}
            </div>

            {result.meta.warning && (
              <p className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                {result.meta.warning}
              </p>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {result.groups.map((group) => {
                const style = TIER_STYLE[group.tier];
                return (
                  <div key={group.tier} className={cn("rounded-xl border p-4 space-y-3", style.bg)}>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                          style.badge,
                        )}
                      >
                        {style.label}
                      </span>
                      <span className="text-sm font-medium">
                        {group.tier === "reach"
                          ? "冲刺志愿"
                          : group.tier === "match"
                          ? "稳妥志愿"
                          : "保底志愿"}
                      </span>
                    </div>

                    {group.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        该档位暂无匹配数据
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {group.items.map((item, i) => (
                          <SchoolCard key={`${item.schoolName}-${item.majorName}-${i}`} item={item} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
