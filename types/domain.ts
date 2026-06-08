export interface YanbotResponse<T = unknown> {
  success: boolean;
  code: number;
  data?: T;
  message?: string;
  name?: string;
  error?: unknown;
}

export interface FeedListItem {
  id: string;
  title: string;
  publicDate: string;
  tags: string[];
}

export interface FeedListData {
  list: FeedListItem[];
  total: number;
  pageNo?: number;
}

export interface FeedDetailData {
  id: string;
  title: string;
  link?: string;
  content?: string;
  contentSummary?: string;
  isoDate?: string;
  pubDate?: string;
  tags?: string[];
  task?: unknown;
  isUnofficial?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TagListItem {
  _id: string;
  name?: string;
  key?: string;
  [k: string]: unknown;
}

export interface TagListData {
  list: TagListItem[];
  total: number;
}

// claw-specific (placeholder shapes for the 3 tools)
export interface SchoolReport {
  schoolName: string;
  major: string;
  summary: string;
  fitScore: number;
  sections: Array<{ title: string; body: string }>;
  dataSource: "real" | "mock";
}

export interface ContentDraft {
  kind: "xhs" | "video-script";
  title: string;
  body: string;
  tags: string[];
  cover?: string;
}

export interface Recommendation {
  schoolName: string;
  schoolCity: string | null;
  schoolTags: string[];
  majorName: string;
  minScore: number;
  scoreDiff: number;
  admitProbability: "high" | "medium" | "low";
  reason: string;
}

export interface RecommendGroup {
  tier: "reach" | "match" | "safety";
  label: "冲" | "稳" | "保";
  items: Recommendation[];
}

export interface RecommendResult {
  candidate: {
    score: number;
    subjectGroup: "physics" | "history";
    cityPrefs?: string[];
    schoolTags?: string[];
    majorKeywords?: string[];
    gender?: "M" | "F";
  };
  groups: RecommendGroup[];
  meta: {
    dataYear: number;
    totalCandidates: number;
    relaxed?: string[];
    warning?: string;
  };
}
