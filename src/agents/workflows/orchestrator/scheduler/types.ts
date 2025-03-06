import { FinishedWorkflow } from '../nodes/finishWorkflowPrompt.js';

export interface ScheduledTask {
  id: string;
  message: string;
  status: 'scheduled' | 'processing' | 'completed' | 'failed' | 'deleted';
  createdAt: Date;
  scheduledFor: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: FinishedWorkflow;
  error?: string;
}

export interface TaskQueue {
  currentTask?: ScheduledTask;
  scheduledTasks: ScheduledTask[];
  completedTasks: ScheduledTask[];

  scheduleTask: (message: string, executeAt: Date) => ScheduledTask;

  getNextDueTask: () => ScheduledTask | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateTaskStatus: (id: string, status: ScheduledTask['status'], result?: any) => void;

  deleteTask: (id: string) => void;

  getAllTasks: () => {
    current: ScheduledTask | undefined;
    scheduled: ScheduledTask[];
    completed: ScheduledTask[];
  };

  getTimeUntilNextTask: () => { nextTask?: ScheduledTask; msUntilNext: number | null };
}
