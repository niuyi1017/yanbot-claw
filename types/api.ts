export interface ApiEnvelope<T = unknown> {
  code: number;
  data?: T;
  message?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface SessionUser {
  id: string;
  username: string;
  role: "admin";
}

export interface SearchInput {
  query: string;
}

export interface SchoolReportInput {
  candidate: {
    score?: number;
    major?: string;
    target?: string;
  };
}

export interface ContentInput {
  source: { kind: "feed"; id: string } | { kind: "topic"; topic: string };
  format: "xhs" | "video-script";
}

export interface RecommendInput {
  score: number;
  subjectGroup: "physics" | "history";
  cityPrefs?: string[];
  schoolTags?: ("985" | "211" | "public")[];
  majorKeywords?: string[];
  gender?: "M" | "F";
}

export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: string;
}
