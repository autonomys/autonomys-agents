import { MessageContent } from '@langchain/core/messages';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { DynamicStructuredTool } from '@langchain/core/tools';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseMessageContent = (content: MessageContent): any => {
  if (typeof content === 'string') {
    return JSON.parse(content);
  }
  if (Array.isArray(content)) {
    return JSON.parse(JSON.stringify(content));
  }
  return content;
};

export const toolInterfaceConverter = (tool: DynamicStructuredTool) => {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: zodToJsonSchema(tool.schema),
    },
  };
};
