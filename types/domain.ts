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
