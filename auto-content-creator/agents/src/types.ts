export interface WriterAgentParams {
  category: string;
  topic: string;
  contentType: string;
  otherInstructions: string;
}

export interface WriterAgentOutput {
  finalContent: string;
  research: string;
  reflections: Array<{
    critique: string;
    score: number;
  }>;
  drafts: string[];
}
