import { MessageContent } from '@langchain/core/messages';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { DynamicStructuredTool, StructuredToolInterface } from '@langchain/core/tools';
import { ZodType } from 'zod';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toolInterfaceConverter = (tool: DynamicStructuredTool | StructuredToolInterface): any => {
  // Handle DynamicStructuredTool
  if ('schema' in tool && typeof tool.schema === 'object' && 'parse' in tool.schema) {
    // If it has a parse method, it's likely a Zod schema
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: zodToJsonSchema(tool.schema as ZodType),
      },
    };
  }
  
  // Handle StructuredToolInterface
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.schema,
    },
  };
};
