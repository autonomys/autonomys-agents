export interface AppState {
  value: string;
  scheduledTasks: Array<Task>;
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
  currentTask?: Task;
  error?: string;
}

export interface TasksAreaProps {
  tasks: Array<Task>;
  onDeleteTask: (id: string) => void;
  processingTasks?: Array<Task>;
  scheduledTasks?: Array<Task>;
  completedTasks?: Array<Task>;
  cancelledTasks?: Array<Task>;
  failedTasks?: Array<Task>;
  deletedTasks?: Array<Task>;
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

export interface Task {
  id: string;
  time: Date;
  description: string;
  startedAt?: Date;
  status?: string;
  result?: string;
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
    cancelled: any[];
    failed: any[];
    deleted: any[];
    completed: any[];
  };
  message?: string;
}
