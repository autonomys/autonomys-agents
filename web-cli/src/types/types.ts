export interface AppState {
  value: string;
  isProcessing: boolean;
  scheduledTasks: Array<ScheduledTask>;
}

export interface WorkflowResult {
  secondsUntilNextWorkflow?: number;
  nextWorkflowPrompt?: string;
  workflowSummary?: string;
}

export interface OutputLogProps {
  messages: string[];
}

export interface StatusBoxProps {
  status: string;
}

export interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
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
}
