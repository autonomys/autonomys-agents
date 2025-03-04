export interface AppState {
  value: string;
  isProcessing: boolean;
  scheduledTasks: Array<{
    time: Date;
    description: string;
  }>;
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
  tasks: Array<{
    time: Date;
    description: string;
  }>;
  onDeleteTask: (index: number) => void;
}

export interface CharacterBoxProps {
  character: string;
}

export interface ClockBoxProps {
  time: Date;
}
