import { BaseMessage } from '@langchain/core/messages';

export interface WriterAgentParams {
  category: string;
  topic: string;
  contentType: string;
  otherInstructions: string;
  humanFeedback?: string;
}

export interface WriterAgentOutput {
  finalContent: string;
  research: string;
  reflections: Array<{
    critique: string;
    score: number;
  }>;
  drafts: string[];
  feedbackHistory?: string[];
}

export interface ThreadState {
  state: {
    messages: BaseMessage[];
    reflectionScore: number;
    researchPerformed: boolean;
    research: string;
    reflections: Array<{ critique: string; score: number }>;
    drafts: string[];
    feedbackHistory: string[];
  };
  lastOutput?: WriterAgentOutput;
}
