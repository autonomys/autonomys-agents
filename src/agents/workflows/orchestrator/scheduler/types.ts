import { SqliteService } from '../../../../services/sqlite/SqliteDB.js';

export type TaskStatus = 'scheduled' | 'processing' | 'completed' | 'failed' | 'deleted';
export interface ScheduledTask {
  id: string;
  namespace: string;
  message: string;
  status: TaskStatus;
  createdAt: Date;
  scheduledFor: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: string;
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

  getAllTasks: (limit?: number) => {
    current: ScheduledTask | undefined;
    scheduled: ScheduledTask[];
    completed: ScheduledTask[];
  };

  getTimeUntilNextTask: () => { nextTask?: ScheduledTask; msUntilNext: number | null };
}

export interface SchedulerDatabase {
  getSqliteService(): SqliteService;
  getTableName(namespace: string): string;
  ensureNamespaceTable(namespace: string): void;
  closeDatabase(): void;
}

export interface TaskRow {
  id: string;
  message: string;
  status: string;
  created_at: string;
  scheduled_for: string;
  started_at?: string;
  completed_at?: string;
  result?: string;
  error?: string;
}

export interface CreateTaskParams {
  id: string;
  namespace: string;
  message: string;
  status: TaskStatus;
  created_at: string;
  scheduled_for: string;
}

export interface UpdateTaskStatusParams {
  id: string;
  namespace: string;
  status: TaskStatus;
  started_at?: string;
  completed_at?: string;
  result?: string;
  error?: string;
}

export interface GetTasksParams {
  namespace: string;
  status?: TaskStatus | TaskStatus[];
  limit?: number;
  offset?: number;
}
