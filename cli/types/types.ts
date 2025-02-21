import blessed from 'blessed';
import { Mutex } from 'async-mutex';

export interface UIComponents {
  screen: blessed.Widgets.Screen;
  outputLog: blessed.Widgets.Log;
  statusBox: blessed.Widgets.BoxElement;
  scheduledTasksBox: blessed.Widgets.ListElement;
  inputBox: blessed.Widgets.TextareaElement;
  clockBox: blessed.Widgets.BoxElement;
  logoBox: blessed.Widgets.BoxElement;
  characterBox: blessed.Widgets.BoxElement;
  searchBox: blessed.Widgets.TextboxElement;
  helpBox: blessed.Widgets.BoxElement;
}

export interface AppState {
  value: string;
  isProcessing: boolean;
  scheduledTasks: Array<{
    time: Date;
    description: string;
  }>;
  mutex: Mutex;
}

export interface WorkflowResult {
  secondsUntilNextWorkflow?: number;
  nextWorkflowPrompt?: string;
  workflowSummary?: string;
}
