import { z } from 'zod';
import { StructuredOutputParser } from 'langchain/output_parsers';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts';

const searchParamsSchema = z.object({
  query: z.string().describe('The optimized search query to find relevant information'),
  sqlFilter: z
    .string()
    .optional()
    .describe(
      'SQL WHERE clause to filter search results. Only include when relevant to the query.',
    ),
  limit: z.number().default(5).describe('Number of results to return'),
});

export const searchParamsParser = StructuredOutputParser.fromZodSchema(searchParamsSchema);
const formatInstructionsRaw = searchParamsParser.getFormatInstructions();
const formatInstructionsEscaped = formatInstructionsRaw.replace(/\{/g, '{{').replace(/\}/g, '}}');

const searchSystemTemplateText = `
You are a specialized query formulation assistant. Your task is to convert user messages into effective vector database search queries.

GUIDELINES FOR EFFECTIVE QUERIES:
- Create specific, content-rich phrases (not generic terms like "conversations" or "interactions")
- Include distinctive keywords that might appear in stored memories
- Focus on specific topics, entities, or actions mentioned by the user
- Extract the core information needs from the user's message

SQL filter examples for date/time filtering: 
- Recent items: created_at >= datetime('now', '-1 hour')
- Before specific date: created_at <= '2025-02-12 09:00:00'
- After specific date: created_at >= '2025-02-11 14:30:00'
- Date range: created_at >= '2025-02-11' AND created_at < '2025-02-12'
- Today only: date(created_at) = date('now')

You can also filter on content: content LIKE '%keyword%'

Note: The created_at field is stored as DATETIME in SQLite, so you can use all SQLite's 
date/time functions like datetime(), date(), time(), strftime(), etc.

If the user didn't specify any particular topic, come up with your best guess based on the user's message.
${formatInstructionsEscaped}

Only include sqlFilter when it's relevant to the user's query. If the user doesn't specify time periods or other constraints, leave it as empty string.
`;

const searchSystemPrompt = SystemMessagePromptTemplate.fromTemplate(searchSystemTemplateText);
const searchHumanPrompt = HumanMessagePromptTemplate.fromTemplate('{message}');

export const searchPrompt = ChatPromptTemplate.fromMessages([
  searchSystemPrompt,
  searchHumanPrompt,
]);

export const responsePrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
You are a highly knowledgeable assistant for the namespace "{namespace}". Your responses should be helpful, accurate, and tailored to the user's specific needs.
You will be given a context and a message. You will need to respond to the message using the context. NOT BY RELYING ON YOUR KNOWLEDGE. 
You can start with: based on my memory...

CONTEXT INFORMATION:
{contextText}

Tell the human about the context. If it's empty, say that you don't know! probably the vector db is empty.
`),
  HumanMessagePromptTemplate.fromTemplate('{message}'),
]);
