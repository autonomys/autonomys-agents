import { SqliteService } from '../../../../services/sqlite/SqliteDB.js';

export type TaskStatus =
  | 'scheduled'
  | 'processing'
  | 'stopped'
  | 'completed'
  | 'failed'
  | 'deleted';
export interface Task {
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
  currentTask?: Task;
  scheduledTasks: Task[];
  completedTasks: Task[];

  scheduleTask: (message: string, executeAt: Date) => Task;

  getNextDueTask: () => Task | undefined;

  updateTaskStatus: (id: string, status: Task['status'], result?: string) => void;

  deleteTask: (id: string) => void;

  getAllTasks: (limit?: number) => {
    current: Task | undefined;
    scheduled: Task[];
    completed: Task[];
  };

  getTimeUntilNextTask: () => { nextTask?: Task; msUntilNext: number | null };
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
