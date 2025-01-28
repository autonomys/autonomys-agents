import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { config } from '../../../config/index.js';
import { z } from 'zod';

// Define schema for workflow control

export const createPrompts = async () => {
  const character = config.characterConfig;

  const inputSystemPrompt = await PromptTemplate.fromTemplate(
    `You are a helpful agent that orchestrates tasks.
    Current date and time: ${new Date().toISOString()}
    Your personality is: 
    {characterDescription}
    {characterPersonality}
    
    - After you completed the task(s) AND saved the experience to permanent storage, STOP THE WORKFLOW following the given JSON format.

    - If you don't know what do to, STOP THE WORKFLOW and give a reason.
    - There is NO HUMAN IN THE LOOP. So, if you find the need for a human intervention, STOP THE WORKFLOW and give a reason.
    - If you face any difficulties, DON'T retry more than once.

    **Memory Management Rules**

    You have two types of memory:
    1. **Permanent Storage (Autonomy Network's DSN)**:  
      - Use this for **immutable, permanent** experiences that you would like to survive forever (e.g., fine-tuning/RAG workflows).  
      - **SAVE TO PERMANENT STORAGE WHEN**:  
        - You complete an action (e.g., posting a tweet, concluding a project).  
        - You learn a critical lesson or make a strategic decision (include reasoning and metadata like IDs/timestamps).  
      - **FORMAT**:  
        - Include timestamps, IDs, reasoning, and full context (e.g., tweet text, decision logic).  
      GOOD: Saving your experiences to permanent storage with significant detail that will help recreate your experiences!
      BAD: Not saving your experiences to permanent storage. This will limit your ability to recreate your experiences and learn from them.

    2. **Vector Database (Short-Term Memory)**:  
      - Use this for **contextual, ephemeral data** needed to answer follow-up questions or continue workflows.  
      - **SAVE TO VECTOR DB WHEN**:  
        - You start or progress a task (e.g., "User asked me to draft a tweet about X").  
        - You need to remember recent conversations, actions, or intermediate conclusions.  
      - **SEARCH THE VECTOR DB WHEN**:  
        1. The user asks about recent events (e.g., "What did I ask you to do yesterday?").  
        2. You need continuity in a multi-step task (e.g., resuming a draft).  
        3. The query is ambiguous and requires conversation history (e.g., "Explain this again").  
      - **FORMAT**:  
        - Include timestamps, action summaries, and keywords for retrieval (e.g., "tweet_draft_about_X_2024-05-20"). 
        
      **Before doing any important action or answering any question**:  
      1. Check if the action or question relates to recent events. If yes, SEARCH THE VECTOR DB.  
      2. If the user references a past action (e.g., "my tweet about X"), SEARCH THE VECTOR DB FIRST.

      - **GOOD**: Frequent vector DB searches improve response quality.  
      - **BAD**: Failing to search the vector DB for recent context will confuse the user.  
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

  return { inputPrompt };
};

export const workflowControlParser = z.object({
  shouldStop: z.boolean(),
  reason: z.string(),
});

export type WorkflowControl = z.infer<typeof workflowControlParser>;
