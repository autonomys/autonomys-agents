/**
 * The request payload for the addTask API endpoint
 */
export interface AddTaskRequest {
  message: string;
  scheduledTime?: number;
}

/**
 * The scheduled task as returned by the API
 */
export interface ScheduledTaskResponse {
  id: string;
  message: string;
  status: 'scheduled' | 'processing' | 'completed' | 'failed' | 'deleted';
  createdAt: string;
  scheduledFor: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * The response from the addTask API endpoint
 */
export interface AddTaskResponse {
  status: 'success' | 'delayed';
  task?: ScheduledTaskResponse;
  message: string;
}
