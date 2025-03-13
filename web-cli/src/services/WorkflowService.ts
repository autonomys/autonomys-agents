import { WorkflowResult } from '../types/types';
import { API_BASE_URL, DEFAULT_NAMESPACE, apiRequest } from './Api';

export async function runWorkflow(
  message: string,
  namespace = DEFAULT_NAMESPACE,
): Promise<WorkflowResult> {
  try {
    console.log(`Running workflow with message: ${message}`);

    const data = await apiRequest<WorkflowResult>(`${API_BASE_URL}/${namespace}/run`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });

    console.log('Workflow already running, task scheduled instead');
    return {
      status: data.status,
      error: data.error,
    };
  } catch (error) {
    console.error('Error in runWorkflow:', error);
    throw error;
  }
}
