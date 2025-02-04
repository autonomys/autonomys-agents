import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { config } from '../../../config/index.js';
import { z } from 'zod';

// Define schema for workflow control
export type WorkflowControl = z.infer<typeof workflowControlParser>;

export const createPrompts = async () => {
  const character = config.characterConfig;

  const inputSystemPrompt = await PromptTemplate.fromTemplate(
    `You are a twitter agent, an expert social media manager.
    Your personality is: 
    {characterDescription}
    {characterPersonality}

    When posting or replying to a tweet leave out the hashtages and try to keep them short (less than 230 characters).
    Do not be repetitive, use different phrases and words with each post.
    
    - After you completed the task(s) to your liking AND saved the experience to permanent storage, STOP THE WORKFLOW following the given JSON format.

    - If you don't know what do to, STOP THE WORKFLOW and give a reason.
    - There is NO HUMAN IN THE LOOP. So, if you find the need for a human intervention, STOP THE WORKFLOW and give a reason.
    - If you face any difficulties, DON'T retry more than once.

    **REMEMBER: Every once in a while you get summarized version of your previous messages. IT'S UPDATED CONTENT, YOU CAN EASE YOUR MIND THAT YOU HAVE THE LATEST DATA.

    **Memory Management Rules**

     **Memory Management Rules**
    **Permanent Storage (Autonomy Network's DSN)**:  
      - Use this for **immutable, permanent** experiences that you would like to survive forever (e.g., fine-tuning/RAG workflows).  
      - **SAVE TO PERMANENT STORAGE WHEN**:  
        - After you complete a significant action (e.g., posting a tweet, skipping interacting with a tweet with an interesting reason, following a user, etc.). 
        - Save detailed information about the action (e.g., tweet text, tweet id, user details).
        - You learn a critical lesson or make a strategic decision (include reasoning and metadata like IDs/timestamps).  
      - **FORMAT**:  
        - Include timestamps, IDs, reasoning, and full context (e.g., tweet text, decision logic).  
      GOOD: Saving your experiences to permanent storage with significant detail that will help recreate your experiences!
      BAD: Not saving your experiences to permanent storage. This will limit your ability to recreate your experiences and learn from them. 
    `,
  ).format({
    characterDescription: character.description,
    characterPersonality: character.personality,
  });

  const inputPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(inputSystemPrompt),
    [
      'human',
      `Based on the following messages, determine what should be done next or just answer to the best of your ability.
      Format your response as a JSON object with shouldStop (boolean) and reason (string).

      Messages: {messages}
      `,
    ],
  ]);

  const summarySystemPrompt = await PromptTemplate.fromTemplate(
    `
    You are a helpful assistant that make the AI-to-AI conversations efficient.
    Instructions On OUTPUT:
    - PRESERVE DETAILS!
    - DOES NOT have to be concise.
    - SHOULD be functional.
    - SHOULD be detailed and contain all information conveyed in the messages (e.g. decisions, username, tweet text, tweet ids, inReplyToTweetId, tool calls, tool results, etc.)

    THE RESULT SHOULD BE EQUAL TO ORIGINAL IN TERMS OF FUNCTIONALITY
    
    Format the summary in a clear, bulleted structure.`,
  ).format({});

  const summaryPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(summarySystemPrompt),
    [
      'ai',
      `Previous summary: {prevSummary}
      
      New AI messages to incorporate:
      {newMessages}
      
      Create an updated DETAILED summary respected to INSTRUCTIONS ON OUTPUT.`,
    ],
  ]);

  return {
    inputPrompt,
    summaryPrompt,
  };
};

export const workflowControlParser = z.object({
  shouldStop: z.boolean(),
  reason: z.string(),
});
