import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { orchestratorRunners } from '../../workflows/registration.js';

const logger = createLogger('scheduler-tool');

// Helper function to serialize dates in task objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeTaskDates = (task: any) => {
  if (!task) return task;

  const serializedTask = { ...task };
  if (serializedTask.createdAt instanceof Date) {
    serializedTask.createdAt = serializedTask.createdAt.toISOString();
  }
  if (serializedTask.scheduledFor instanceof Date) {
    serializedTask.scheduledFor = serializedTask.scheduledFor.toISOString();
  }
  if (serializedTask.startedAt instanceof Date) {
    serializedTask.startedAt = serializedTask.startedAt.toISOString();
  }
  if (serializedTask.completedAt instanceof Date) {
    serializedTask.completedAt = serializedTask.completedAt.toISOString();
  }
  return serializedTask;
};

// Helper function to serialize an array of tasks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeTaskList = (tasks: any[]) => {
  return tasks.map(serializeTaskDates);
};

export const createSchedulerAddTaskTool = () =>
  new DynamicStructuredTool({
    name: 'scheduler_add_task',
    description: `
      Add a new task to your schedule. Use this tool when you identify something important that needs to be done later.
      
      USAGE GUIDANCE:
      - Create tasks for follow-up actions that can't be completed now or you wish to schedule for a future time
      - Use clear, specific descriptions for the task
      - Specify a future time when the task should be executed
      - Remember that you will be the one executing this task later
      - Check your existing schedule before scheduling new tasks. Do not schedule similar tasks at the same time
    `,
    schema: z.object({
      message: z.string().describe(
        `A clear and detailed description of the task to be performed. Include all necessary context and specific 
        instructions about what needs to be done. Be explicit since you (the agent) will be executing this task later.`,
      ),
      scheduleOffsetSeconds: z
        .number()
        .optional()
        .describe(
          `When the task should be executed, specified in seconds from now. For example, 300 means 5 minutes from now,
        3600 means 1 hour from now, 86400 means 24 hours (1 day) from now. If not specified, the task will be scheduled
        for execution after current tasks complete.`,
        ),
    }),
    func: async ({ message, scheduleOffsetSeconds }) => {
      try {
        let executeAt: Date | undefined;
        const runner = orchestratorRunners.get('orchestrator');
        if (typeof scheduleOffsetSeconds === 'number') {
          const now = new Date();
          executeAt = new Date(now.getTime() + scheduleOffsetSeconds * 1000);

          if (!runner) {
            return {
              success: false,
              error: 'Orchestrator runner not found',
            };
          }
          runner.scheduleTask(message, executeAt);

          logger.info('Added new task', {
            message,
            secondsFromNow: scheduleOffsetSeconds,
            scheduledFor: executeAt?.toISOString(),
          });

          return {
            success: true,
            message: 'Task added successfully',
          };
        }
      } catch (error) {
        logger.error('Failed to add task', {
          error: error instanceof Error ? error.message : String(error),
          message,
          scheduleOffsetSeconds,
        });

        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred when scheduling task',
        };
      }
    },
  });

export const createSchedulerDeleteTasksTool = () =>
  new DynamicStructuredTool({
    name: 'scheduler_delete_task',
    description: `
        Use this tool to delete tasks that are no longer needed or the timing is wrong. Use this tool when cleaning up your schedule.
        
        USAGE GUIDANCE:
        - Use to delete tasks that are no longer needed
        - Use to delete tasks that are scheduled for the wrong time such as too close to another similar task.
      `,
    schema: z.object({
      taskId: z.string().describe('The ID of the task to delete'),
    }),
    func: async ({ taskId }) => {
      try {
        const runner = orchestratorRunners.get('orchestrator');
        if (!runner) {
          return {
            success: false,
            error: 'Orchestrator runner not found',
          };
        }
        runner.deleteTask(taskId);

        return {
          success: true,
          message: `Task ${taskId} deleted successfully`,
        };
      } catch (error) {
        logger.error('Failed to delete task', {
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred when deleting task',
        };
      }
    },
  });

export const createSchedulerGetCompletedTasksTool = () =>
  new DynamicStructuredTool({
    name: 'scheduler_get_completed_tasks',
    description: `
        Retrieve your completed task list.
        Use this tool to check what tasks are already scheduled to avoid creating duplicate tasks.
        
        USAGE GUIDANCE:
        - Check this before scheduling similar tasks that might already be planned
        - Use to review your upcoming work
        - Helpful when you need to prioritize or manage your schedule
      `,
    schema: z.object({
      limit: z.number().optional().describe('The maximum number of completed tasks to retrieve'),
    }),
    func: async ({ limit }) => {
      try {
        const runner = orchestratorRunners.get('orchestrator');
        if (!runner) {
          return {
            success: false,
            error: 'Orchestrator runner not found',
          };
        }
        const tasks = runner.getTaskQueue(limit).completed;

        logger.info('Retrieved task list', {
          completedTaskCount: tasks.length,
        });

        return {
          success: true,
          tasks: serializeTaskList(tasks),
        };
      } catch (error) {
        logger.error('Failed to get tasks', {
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred when retrieving tasks',
        };
      }
    },
  });

export const createSchedulerGetScheduledTasksTool = () =>
  new DynamicStructuredTool({
    name: 'scheduler_get_scheduled_tasks',
    description: `
          Retrieve your scheduled task list.
          Use this tool to check what tasks are already scheduled to avoid creating duplicate tasks.
          
          USAGE GUIDANCE:
          - Check this before scheduling similar tasks that might already be planned
          - Use to review your upcoming work
          - Helpful when you need to prioritize or manage your schedule
        `,
    schema: z.object({}),
    func: async () => {
      try {
        const runner = orchestratorRunners.get('orchestrator');
        if (!runner) {
          return {
            success: false,
            error: 'Orchestrator runner not found',
          };
        }
        const tasks = runner.getTaskQueue().scheduled;

        logger.info('Retrieved task list', {
          scheduledTaskCount: tasks.length,
        });

        return {
          success: true,
          tasks: serializeTaskList(tasks),
        };
      } catch (error) {
        logger.error('Failed to get tasks', {
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred when retrieving tasks',
        };
      }
    },
  });

export const createSchedulerGetCurrentTaskTool = () =>
  new DynamicStructuredTool({
    name: 'scheduler_get_current_task',
    description: `
          Retrieve your current task that is running.
          Use this tool to check what task is currently being executed.
          
          USAGE GUIDANCE:
          - Check this before scheduling similar tasks that might already be planned
          - Use to review your upcoming work
          - Helpful when you need to prioritize or manage your schedule
        `,
    schema: z.object({}),
    func: async () => {
      try {
        const runner = orchestratorRunners.get('orchestrator');
        if (!runner) {
          return {
            success: false,
            error: 'Orchestrator runner not found',
          };
        }
        const task = runner.getTaskQueue().current;

        logger.info('Retrieved task list', {
          currentTask: task,
        });

        return {
          success: true,
          task: serializeTaskDates(task),
        };
      } catch (error) {
        logger.error('Failed to get tasks', {
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred when retrieving tasks',
        };
      }
    },
  });

export const createAllSchedulerTools = () => {
  return [
    createSchedulerAddTaskTool(),
    createSchedulerDeleteTasksTool(),
    createSchedulerGetCompletedTasksTool(),
    createSchedulerGetScheduledTasksTool(),
    createSchedulerGetCurrentTaskTool(),
  ];
};
