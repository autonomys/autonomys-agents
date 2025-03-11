import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { orchestratorRunners } from '../../workflows/registration.js';

const logger = createLogger('scheduler-tool');

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

export const createSchedulerGetTasksTool = () =>
  new DynamicStructuredTool({
    name: 'scheduler_get_tasks',
    description: `
      Retrieve your current task list including scheduled, current, and completed tasks.
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
        const tasks = runner.getTaskQueue();

        logger.info('Retrieved task list', {
          currentTaskCount: tasks.current ? 1 : 0,
          scheduledTaskCount: tasks.scheduled.length,
          completedTaskCount: tasks.completed.length,
        });

        return {
          success: true,
          tasks: tasks,
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

export const createSchedulerDeleteTasksTool = () =>
  new DynamicStructuredTool({
    name: 'scheduler_delete_task',
    description: `
        Delete your current task by its ID.
        Use this tool to delete tasks that are no longer needed.
        
        USAGE GUIDANCE:
        - Use to delete tasks that are no longer needed
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

export const createAllSchedulerTools = () => {
  return [
    createSchedulerAddTaskTool(),
    createSchedulerGetTasksTool(),
    createSchedulerDeleteTasksTool(),
  ];
};
