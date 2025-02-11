import blessed from 'blessed';

export interface UIComponents {
  screen: blessed.Widgets.Screen;
  outputLog: blessed.Widgets.Log;
  statusBox: blessed.Widgets.BoxElement;
  scheduledTasksBox: blessed.Widgets.ListElement;
  inputBox: blessed.Widgets.TextboxElement;
  clockBox: blessed.Widgets.BoxElement;
  logoBox: blessed.Widgets.BoxElement;
}

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
