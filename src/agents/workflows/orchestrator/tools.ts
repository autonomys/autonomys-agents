import { createTwitterWorkflowTool } from './workflowTools/twitterWorkflowTool.js';

export const createTools = () => {
  const twitterWorkflowTool = createTwitterWorkflowTool();
  return {
    twitterWorkflowTool,
    tools: [twitterWorkflowTool],
  };
};
