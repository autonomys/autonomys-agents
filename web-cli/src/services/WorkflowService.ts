import { WorkflowResult } from '../types/types';

const API_PORT = process.env.REACT_APP_API_PORT || '3001';
const API_BASE_URL = `http://localhost:${API_PORT}/api`;

const DEFAULT_NAMESPACE = 'orchestrator';

export async function runWorkflow(
  message: string,
  namespace = DEFAULT_NAMESPACE,
): Promise<WorkflowResult> {
  try {
    console.log(`Running workflow with message: ${message}`);

    const response = await fetch(`${API_BASE_URL}/${namespace}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    // If we have an error with status 409, it means a workflow is already running
    // and the message was scheduled as a task instead
    if (!response.ok && response.status === 409) {
      console.log('Workflow already running, task scheduled instead');
      return {
        scheduled: true,
        error: data.error,
      };
    }

    // Handle other errors
    if (!response.ok) {
      console.error('Error running workflow:', data.error);
      throw new Error(data.error || 'Unknown error');
    }

    console.log('Workflow executed successfully:', data.result);
    return data.result;
  } catch (error) {
    console.error('Error in runWorkflow:', error);
    throw error;
  }
}
