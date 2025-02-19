import { BaseMessage, AIMessage } from '@langchain/core/messages';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('llm-standardizer');


export async function standardizeLLMResponse(result: BaseMessage) {
  try {
    // If it's already in Claude's format, return as is
    if (Array.isArray(result.content) && 
        result.content.every(item => 'type' in item && 
          (item.type === 'text' || item.type === 'tool_use'))) {
      return result;
    }

    // Convert OpenAI format to Claude format
    const content = [];

    // Add text content if present
    if (result.content) {
      content.push({
        type: 'text',
        text: result.content.toString(),
      });
    }

    // Convert tool calls if present
    if (result.additional_kwargs?.tool_calls) {
      content.push(...result.additional_kwargs.tool_calls.map(call => ({
        type: 'tool_use',
        id: call.id,
        name: call.function?.name || '',
        input: typeof call.function?.arguments === 'string'
          ? JSON.parse(call.function.arguments)
          : call.function?.arguments || {},
      })));
    }

    // Convert usage information
    const usage = result.additional_kwargs?.usage || result.response_metadata?.usage;
    const modelName = result.additional_kwargs?.model || result.response_metadata?.model;

    return new AIMessage({
      content,
      additional_kwargs: {
        id: result.additional_kwargs?.id || `msg_${Date.now()}`,
        type: 'message',
        role: 'assistant',
        model: modelName,
        stop_reason: result.additional_kwargs?.finish_reason || 'stop',
        stop_sequence: null,
        usage: usage ? {
          input_tokens: usage.prompt_tokens || usage.input_tokens || 0,
          output_tokens: usage.completion_tokens || usage.output_tokens || 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        } : undefined,
      },
      tool_calls: result.additional_kwargs?.tool_calls?.map(call => ({
        name: call.function?.name || '',
        args: typeof call.function?.arguments === 'string'
          ? JSON.parse(call.function.arguments)
          : call.function?.arguments || {},
        id: call.id,
        type: 'tool_call',
      })) || [],
      usage_metadata: usage ? {
        input_tokens: usage.prompt_tokens || usage.input_tokens || 0,
        output_tokens: usage.completion_tokens || usage.output_tokens || 0,
        total_tokens: usage.total_tokens || (usage.input_tokens + usage.output_tokens) || 0,
        input_token_details: {
          cache_creation: 0,
          cache_read: 0,
        },
      } : undefined,
      response_metadata: {
        id: result.additional_kwargs?.id || `msg_${Date.now()}`,
        model: modelName,
        stop_reason: result.additional_kwargs?.finish_reason || 'stop',
        stop_sequence: null,
        usage: usage ? {
          input_tokens: usage.prompt_tokens || usage.input_tokens || 0,
          output_tokens: usage.completion_tokens || usage.output_tokens || 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        } : undefined,
        type: 'message',
        role: 'assistant',
      },
      invalid_tool_calls: [],
    });
  } catch (error) {
    logger.error('Error standardizing LLM response:', { error, result });
    // Return a valid AIMessage even in case of error
    return new AIMessage({
      content: [{
        type: 'text',
        text: typeof result.content === 'string'
          ? result.content
          : JSON.stringify(result.content),
      }],
      additional_kwargs: {
        type: 'message',
        role: 'assistant',
      },
    });
  }
} 