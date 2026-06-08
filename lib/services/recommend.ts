import { getDb } from "@/lib/db";
import { getGenderAffinity, getGenderAffinityLabel } from "./gender-affinity";
import type { RecommendInput } from "@/types/api";
import type { Recommendation, RecommendGroup, RecommendResult } from "@/types/domain";

const YEAR = 2025;

type Tier = "reach" | "match" | "safety";

const TIER_RANGE: Record<Tier, [number, number]> = {
  reach: [-15, -4],
  match: [-3, 8],
  safety: [9, 25],
};

const TIER_MIDPOINT: Record<Tier, number> = {
  reach: -9,
  match: 2,
  safety: 17,
};

type DbRow = {
  school_name: string;
  school_city: string | null;
  school_owner: string | null;
  major_name: string;
  min_score: number;
  is_985: number | null;
  is_211: number | null;
  province_text: string | null;
  rank: number | null;
};

function buildTags(row: DbRow): string[] {
  const tags: string[] = [];
  if (row.is_985) tags.push("985");
  if (row.is_211) tags.push("211");
  if (row.school_owner === "公办") tags.push("公办");
  else if (row.school_owner) tags.push(row.school_owner);
  return tags;
}

function buildReason(
  row: DbRow,
  scoreDiff: number,
  tier: Tier,
  input: RecommendInput,
): string {
  const diffStr = scoreDiff >= 0 ? `+${scoreDiff}` : `${scoreDiff}`;
  const parts: string[] = [];

  if (tier === "reach") {
    parts.push(`分差 ${diffStr} 分，属于冲刺志愿，历史线高于您 ${Math.abs(scoreDiff)} 分`);
  } else if (tier === "match") {
    parts.push(`分差 ${diffStr} 分，与历史录取线持平，录取概率较高`);
  } else {
    parts.push(`分差 ${diffStr} 分，明显高于历史线，可作为保底志愿`);
  }

  if (row.is_985) parts.push("985 重点院校");
  else if (row.is_211) parts.push("211 重点院校");

  if (input.gender) {
    const label = getGenderAffinityLabel(row.major_name, input.gender);
    if (label) parts.push(label);
  }

  return parts.join("；");
}

function admitProbability(tier: Tier): "high" | "medium" | "low" {
  if (tier === "safety") return "high";
  if (tier === "match") return "medium";
  return "low";
}

function queryRows(input: RecommendInput, relaxed: string[]): DbRow[] {
  const db = getDb();
  const { score, subjectGroup, cityPrefs, schoolTags, majorKeywords } = input;

  const conditions: string[] = [
    "a.year = ?",
    "a.subject_group = ?",
    "a.min_score IS NOT NULL",
    "a.min_score BETWEEN ? AND ?",
  ];
  const params: (string | number)[] = [YEAR, subjectGroup, score - 15, score + 25];

  const hasCityPrefs = cityPrefs && cityPrefs.length > 0;
  const hasSchoolTags = schoolTags && schoolTags.length > 0;
  const hasMajorKeywords = majorKeywords && majorKeywords.length > 0;

  if (hasCityPrefs && !relaxed.includes("cityPrefs")) {
    conditions.push(`(${cityPrefs.map(() => "s.province_text = ?").join(" OR ")})`);
    params.push(...cityPrefs);
  }

  if (hasSchoolTags && !relaxed.includes("schoolTags")) {
    const tagConds: string[] = [];
    for (const tag of schoolTags) {
      if (tag === "985") tagConds.push("s.is_985 = 1");
      else if (tag === "211") tagConds.push("s.is_211 = 1");
      else if (tag === "public") tagConds.push("a.school_owner = '公办'");
    }
    if (tagConds.length) conditions.push(`(${tagConds.join(" OR ")})`);
  }

  if (hasMajorKeywords && !relaxed.includes("majorKeywords")) {
    conditions.push(
      `(${majorKeywords.map(() => "a.major_name LIKE ?").join(" OR ")})`,
    );
    params.push(...majorKeywords.map((kw) => `%${kw}%`));
  }

  const sql = `
    SELECT
      a.school_name, a.school_city, a.school_owner, a.major_name, a.min_score,
      s.is_985, s.is_211, s.province_text, s.rank
    FROM admissions a
    LEFT JOIN schools s ON a.school_ref_id = s.school_id
    WHERE ${conditions.join(" AND ")}
  `;

  return db.prepare(sql).all(...params) as DbRow[];
}

function pickTier(
  rows: DbRow[],
  score: number,
  tier: Tier,
  input: RecommendInput,
  count: number,
): Recommendation[] {
  const [lo, hi] = TIER_RANGE[tier];
  const mid = TIER_MIDPOINT[tier];

  const candidates = rows.filter((r) => {
    const d = score - r.min_score;
    return d >= lo && d <= hi;
  });

  // Score each candidate
  const scored = candidates.map((r) => {
    const scoreDiff = score - r.min_score;
    let weight = 0;

    // 1. Tag match count
    if (r.is_985) weight += 2;
    else if (r.is_211) weight += 1;
    if (
      input.cityPrefs?.length &&
      r.province_text &&
      input.cityPrefs.includes(r.province_text)
    ) {
      weight += 1;
    }

    // 2. Distance to tier midpoint (inverted — closer = higher weight)
    weight -= Math.abs(scoreDiff - mid) * 0.1;

    // 3. School rank (lower = better; missing rank = worst)
    weight -= (r.rank ?? 9999) * 0.001;

    // 4. Gender affinity
    if (input.gender) weight += getGenderAffinity(r.major_name, input.gender);

    return { row: r, scoreDiff, weight };
  });

  scored.sort((a, b) => b.weight - a.weight);

  // Deduplicate: max 1 per school within the same tier
  const seen = new Set<string>();
  const result: Recommendation[] = [];
  for (const { row, scoreDiff } of scored) {
    if (result.length >= count) break;
    if (seen.has(row.school_name)) continue;
    seen.add(row.school_name);
    result.push({
      schoolName: row.school_name,
      schoolCity: row.school_city,
      schoolTags: buildTags(row),
      majorName: row.major_name,
      minScore: row.min_score,
      scoreDiff,
      admitProbability: admitProbability(tier),
      reason: buildReason(row, scoreDiff, tier, input),
    });
  }
  return result;
}

export function recommend(input: RecommendInput): RecommendResult {
  const { score } = input;
  const relaxed: string[] = [];
  let rows = queryRows(input, relaxed);

  // Progressive relaxation if total < 9
  const needRelax = () => {
    const tiers: Tier[] = ["reach", "match", "safety"];
    let total = 0;
    for (const tier of tiers) {
      const [lo, hi] = TIER_RANGE[tier];
      total += rows.filter((r) => {
        const d = score - r.min_score;
        return d >= lo && d <= hi;
      }).length;
    }
    return total < 9;
  };

  const relaxOrder = ["majorKeywords", "cityPrefs", "schoolTags"] as const;
  for (const field of relaxOrder) {
    if (needRelax() && input[field]?.length) {
      relaxed.push(field);
      rows = queryRows(input, relaxed);
    }
  }

  const tiers: Tier[] = ["reach", "match", "safety"];
  const tierLabels: Record<Tier, "冲" | "稳" | "保"> = {
    reach: "冲",
    match: "稳",
    safety: "保",
  };

  const groups: RecommendGroup[] = tiers.map((tier) => ({
    tier,
    label: tierLabels[tier],
    items: pickTier(rows, score, tier, input, 3),
  }));

  const totalCandidates = rows.length;

  const meta: RecommendResult["meta"] = { dataYear: YEAR, totalCandidates };
  if (relaxed.length) meta.relaxed = relaxed;
  if (score < 400 || score > 700) {
    meta.warning = "您的分数较为特殊，推荐结果仅供参考，建议结合实际情况判断";
  }

  return {
    candidate: {
      score,
      subjectGroup: input.subjectGroup,
      ...(input.cityPrefs?.length && { cityPrefs: input.cityPrefs }),
      ...(input.schoolTags?.length && { schoolTags: input.schoolTags }),
      ...(input.majorKeywords?.length && { majorKeywords: input.majorKeywords }),
      ...(input.gender && { gender: input.gender }),
    },
    groups,
    meta,
  };
}
