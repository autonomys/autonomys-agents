import { createSaveExperienceTool } from '../../tools/dsn/saveExperienceTool.js';
import { createGetCurrentTimeTool } from '../../tools/time/getTimeTool.js';
export const createTools = () => {
  const saveExperienceTool = createSaveExperienceTool();
  const getCurrentTimeTool = createGetCurrentTimeTool();

  return {
    saveExperienceTool,
    getCurrentTimeTool,
    tools: [saveExperienceTool, getCurrentTimeTool],
  };
};
