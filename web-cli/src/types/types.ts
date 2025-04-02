export interface AppState {
  value: string;
  scheduledTasks: Array<ScheduledTask>;
}

export interface WorkflowResult {
  secondsUntilNextWorkflow?: number;
  nextWorkflowPrompt?: string;
  workflowSummary?: string;
  status?: string;
  error?: string;
}

export interface OutputLogProps {
  messages: string[];
}

export interface StatusBoxProps {
  status: string;
  onStop?: () => void;
}

export interface InputBoxProps {
  value: string;
  handleInputChange: (value: string) => void;
  handleInputSubmit: () => void;
  currentTask?: ScheduledTask;
  error?: string;
}

export interface ScheduledTasksBoxProps {
  tasks: Array<ScheduledTask>;
  onDeleteTask: (id: string) => void;
}

export interface CharacterBoxProps {
  character: string;
}

export interface ClockBoxProps {
  time: Date;
}

export interface EventSourceMessage {
  namespace: string;
  type: string;
  timestamp?: string;
  level?: string;
  message: string;
  meta?: any;
}

export interface ScheduledTask {
  id: string;
  time: Date;
  description: string;
  startedAt?: Date;
  status?: string;
}

export interface LogMessageListProps {
  filteredMessages: EventSourceMessage[];
  legacyMessages?: string[];
  setLogRef: (ref: HTMLDivElement | null) => void;
  searchTerm?: string;
  currentSearchIndex?: number;
  searchResults?: number[];
  showDebugLogs?: boolean;
}

export interface TaskEventMessage {
  type: string;
  timestamp: string;
  namespace: string;
  tasks?: {
    current?: any;
    scheduled: any[];
    completed: any[];
  };
  message?: string;
}
