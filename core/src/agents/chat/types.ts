import { ChatState } from './state.js';

// Modify the InputNodeFunction type to accept any message format
export type InputNodeFunction = (state: typeof ChatState.State) => Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolCalls: any[] | undefined;
}>;
