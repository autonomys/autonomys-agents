import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import axios from 'axios';
import { AddTaskResponse } from './types.js';

const logger = createLogger('scheduler-tool');

/**
 * Creates a tool that allows the agent to add a new task to the scheduler
 * @param port - The port number where the API is running
 * @param namespace - The namespace for the agent (default: 'default')
 * @returns A DynamicStructuredTool that can be used to add tasks
 */
export const createSchedulerAddTaskTool = (port: number, namespace: string = 'default') =>
  new DynamicStructuredTool({
    name: 'scheduler_add_task',
    description: `
      Add a new task to your schedule. Use this tool when you identify something important that needs to be done later.
      
      USAGE GUIDANCE:
      - Create tasks for follow-up actions that can't be completed now
      - Use clear, specific descriptions for the task
      - Specify a future time when the task should be executed
      - Remember that you will be the one executing this task later
    `,
    schema: z.object({
      message: z.string().describe(
        `A clear and detailed description of the task to be performed. Include all necessary context and specific 
        instructions about what needs to be done. Be explicit since you (the agent) will be executing this task later.`,
      ),
      scheduledTime: z
        .number()
        .optional()
        .describe(
          `When the task should be executed, specified in seconds from now. For example, 300 means 5 minutes from now,
        3600 means 1 hour from now, 86400 means 24 hours (1 day) from now. If not specified, the task will be scheduled
        for execution after current tasks complete.`,
        ),
    }),
    func: async ({ message, scheduledTime }) => {
      try {
        let executeAt: Date | undefined;

        if (typeof scheduledTime === 'number') {
          const now = new Date();
          executeAt = new Date(now.getTime() + scheduledTime * 1000);
        }

        const requestBody = {
          message,
          scheduledTime: executeAt?.toISOString(),
        };

        const { data } = await axios.post<AddTaskResponse>(
          `http://localhost:${port}/api/${namespace}/addTask`,
          requestBody,
        );

        logger.info('Added new task via API', {
          message,
          secondsFromNow: scheduledTime,
          scheduledFor: executeAt?.toISOString(),
          response: data,
        });

        return {
          success: true,
          taskId: data.task?.id,
          scheduledFor: data.task?.scheduledFor || executeAt?.toISOString(),
          message: data.message,
        };
      } catch (error) {
        logger.error('Failed to add task', {
          error: error instanceof Error ? error.message : String(error),
          message,
          scheduledTime,
        });

        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred when scheduling task',
        };
      }
    },
  });
