export interface ContentGenerationParams {
  category: string;
  topic: string;
  contentType: string;
  otherInstructions: string;
}

export interface ContentGenerationOutput {
  id: number;
  finalContent: string;
  research: string;
  reflections: Array<{
    critique: string;
    score: number;
  }>;
  drafts: string[];
}

export interface ContentItem {
  id: number;
  category: string;
  topic: string;
  contentType: string;
  finalContent: string;
  research: string;
  reflections: string;
  drafts: string;
  createdAt: string;
}

export interface ContentListResponse {
  contents: ContentItem[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}
