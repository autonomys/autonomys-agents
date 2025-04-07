import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../../../../../utils/logger.js';
import { getSchedulerDatabase } from './schedulerDb.js';
import {
  CreateTaskParams,
  GetTasksParams,
  Task,
  TaskRow,
  TaskStatus,
  UpdateTaskStatusParams,
} from '../types.js';

const logger = createLogger('task-repository');
const schedulerDb = getSchedulerDatabase();

const rowToTask = (row: TaskRow, namespace: string): Task => {
  return {
    id: row.id,
    namespace,
    message: row.message,
    status: row.status as TaskStatus,
    createdAt: new Date(row.created_at),
    scheduledFor: new Date(row.scheduled_for),
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    result: row.result,
    error: row.error,
  };
};

export const createTask = (params: CreateTaskParams): Task => {
  schedulerDb.ensureNamespaceTable(params.namespace);

  const db = schedulerDb.getSqliteService().getDatabase();
  const tableName = schedulerDb.getTableName(params.namespace);

  try {
    const stmt = db.prepare(`
      INSERT INTO ${tableName} (id, message, status, created_at, scheduled_for)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(params.id, params.message, params.status, params.created_at, params.scheduled_for);

    logger.debug(`Created task: ${params.id}`, { namespace: params.namespace });

    return {
      id: params.id,
      namespace: params.namespace,
      message: params.message,
      status: params.status,
      createdAt: new Date(params.created_at),
      scheduledFor: new Date(params.scheduled_for),
    };
  } catch (error) {
    logger.error(
      `Failed to create task: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
};

export const scheduleTask = (namespace: string, message: string, scheduledFor: Date): Task => {
  const taskId = uuidv4();
  const now = new Date();

  return createTask({
    id: taskId,
    namespace,
    message,
    status: 'scheduled',
    created_at: now.toISOString(),
    scheduled_for: scheduledFor.toISOString(),
  });
};

export const updateTaskStatus = (params: UpdateTaskStatusParams): void => {
  schedulerDb.ensureNamespaceTable(params.namespace);

  const db = schedulerDb.getSqliteService().getDatabase();
  const tableName = schedulerDb.getTableName(params.namespace);

  try {
    const setClauses = ['status = ?'];
    const values: (string | TaskStatus)[] = [params.status];

    if (params.started_at) {
      setClauses.push('started_at = ?');
      values.push(params.started_at);
    }

    if (params.completed_at) {
      setClauses.push('completed_at = ?');
      values.push(params.completed_at);
    }

    if (params.result) {
      setClauses.push('result = ?');
      values.push(params.result);
    }

    if (params.error) {
      setClauses.push('error = ?');
      values.push(params.error);
    }

    const setClause = setClauses.join(', ');
    const stmt = db.prepare(`
      UPDATE ${tableName}
      SET ${setClause}
      WHERE id = ?
    `);

    values.push(params.id);

    const result = stmt.run(...values);

    if (result.changes === 0) {
      logger.warn(`No task found to update: ${params.id}`, { namespace: params.namespace });
    } else {
      logger.debug(`Updated task status: ${params.id} -> ${params.status}`, {
        namespace: params.namespace,
      });
    }
  } catch (error) {
    logger.error(
      `Failed to update task status: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
};

export const deleteTask = (namespace: string, taskId: string): void => {
  schedulerDb.ensureNamespaceTable(namespace);

  const db = schedulerDb.getSqliteService().getDatabase();
  const tableName = schedulerDb.getTableName(namespace);

  try {
    const stmt = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
    const result = stmt.run(taskId);

    if (result.changes === 0) {
      logger.warn(`No task found to delete: ${taskId}`, { namespace });
    } else {
      logger.debug(`Deleted task: ${taskId}`, { namespace });
    }
  } catch (error) {
    logger.error(
      `Failed to delete task: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
};

export const getTaskById = (namespace: string, taskId: string): Task | null => {
  schedulerDb.ensureNamespaceTable(namespace);

  const db = schedulerDb.getSqliteService().getDatabase();
  const tableName = schedulerDb.getTableName(namespace);

  try {
    const stmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
    const task = stmt.get(taskId) as TaskRow | undefined;

    if (!task) {
      return null;
    }

    return rowToTask(task, namespace);
  } catch (error) {
    logger.error(`Failed to get task: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

export const getTasks = (params: GetTasksParams): Task[] => {
  schedulerDb.ensureNamespaceTable(params.namespace);

  const db = schedulerDb.getSqliteService().getDatabase();
  const tableName = schedulerDb.getTableName(params.namespace);

  try {
    const query = buildTaskQuery(tableName, params);
    const queryParams = buildTaskQueryParams(params);

    const stmt = db.prepare(query);
    const tasks = stmt.all(...queryParams) as TaskRow[];

    return tasks.map(task => rowToTask(task, params.namespace));
  } catch (error) {
    logger.error(`Failed to get tasks: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

const buildTaskQuery = (tableName: string, params: GetTasksParams): string => {
  const whereClauses: string[] = [];
  const query = [`SELECT * FROM ${tableName}`];

  if (params.status) {
    if (Array.isArray(params.status)) {
      const placeholders = params.status.map(() => '?').join(', ');
      whereClauses.push(`status IN (${placeholders})`);
    } else {
      whereClauses.push('status = ?');
    }
  }

  if (whereClauses.length > 0) {
    query.push(`WHERE ${whereClauses.join(' AND ')}`);
  }

  query.push('ORDER BY scheduled_for ASC');

  if (params.limit) {
    query.push('LIMIT ?');

    if (params.offset) {
      query.push('OFFSET ?');
    }
  }

  return query.join(' ');
};

const buildTaskQueryParams = (params: GetTasksParams): (string | number | TaskStatus)[] => {
  const queryParams: (string | number | TaskStatus)[] = [];

  if (params.status) {
    if (Array.isArray(params.status)) {
      queryParams.push(...params.status);
    } else {
      queryParams.push(params.status);
    }
  }

  if (params.limit) {
    queryParams.push(params.limit);

    if (params.offset) {
      queryParams.push(params.offset);
    }
  }

  return queryParams;
};

export const getNextDueTasks = (namespace: string, limit: number = 10): Task[] => {
  schedulerDb.ensureNamespaceTable(namespace);

  const db = schedulerDb.getSqliteService().getDatabase();
  const tableName = schedulerDb.getTableName(namespace);

  const now = new Date().toISOString();

  try {
    const stmt = db.prepare(`
      SELECT * FROM ${tableName} 
      WHERE status = 'scheduled' AND scheduled_for <= ? 
      ORDER BY scheduled_for ASC
      LIMIT ?
    `);

    const tasks = stmt.all(now, limit) as TaskRow[];

    return tasks.map(task => rowToTask(task, namespace));
  } catch (error) {
    logger.error(
      `Failed to get due tasks: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
};

export const markTaskAsProcessing = (namespace: string, taskId: string): void => {
  const now = new Date();

  updateTaskStatus({
    id: taskId,
    namespace,
    status: 'processing',
    started_at: now.toISOString(),
  });
};

export const markTaskAsCompleted = (namespace: string, taskId: string, result?: unknown): void => {
  const now = new Date();
  const resultJson = result ? JSON.stringify(result) : undefined;

  updateTaskStatus({
    id: taskId,
    namespace,
    status: 'completed',
    completed_at: now.toISOString(),
    result: resultJson,
  });
};

export const markTaskAsFailed = (namespace: string, taskId: string, error: string): void => {
  const now = new Date();

  updateTaskStatus({
    id: taskId,
    namespace,
    status: 'failed',
    completed_at: now.toISOString(),
    error,
  });
};

export const markTaskAsStopped = (namespace: string, taskId: string, message?: string): void => {
  updateTaskStatus({
    id: taskId,
    namespace,
    status: 'stopped',
    error: message,
  });
};
