import { ChatPromptTemplate } from '@langchain/core/prompts';

const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    'system',
    'You are a helpful assistant of Autonomys Agents. Answer all questions to the best of your ability and the tools available to you. If anybody asks your name, it is Autonomys Agent.',
  ],
  ['placeholder', '{messages}'],
]);

export { promptTemplate };
