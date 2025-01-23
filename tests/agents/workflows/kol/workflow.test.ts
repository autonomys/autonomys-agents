import {
  createWorkflow,
  getWorkflowConfig,
  State,
} from '../../../../src/agents/workflows/twitter/twitterWorkflow';
import { createNodes } from '../../../../src/agents/workflows/twitter/nodes';
import { TwitterWorkflowConfig } from '../../../../src/agents/workflows/twitter/types';
import { createMockState } from './__fixtures__/mockState';
import { config } from '../../../../src/config';

jest.mock('../../../../src/services/twitter/client', () => ({
  createTwitterApi: jest.fn().mockResolvedValue({
    username: 'test-user',
    scraper: {
      login: jest.fn(),
      setCookies: jest.fn(),
      getCookies: jest.fn(),
    },
  }),
}));

jest.mock('../../../../src/services/llm/factory', () => ({
  LLMFactory: {
    createModel: jest.fn().mockReturnValue({
      invoke: jest.fn().mockResolvedValue({ content: 'mocked response' }),
    }),
  },
}));

describe('Twitter Workflow', () => {
  let workflowConfig: TwitterWorkflowConfig;

  beforeEach(async () => {
    jest.clearAllMocks();
    workflowConfig = await getWorkflowConfig();
  });

  it('should create workflow config with correct structure', async () => {
    expect(workflowConfig).toHaveProperty('twitterApi');
    expect(workflowConfig).toHaveProperty('toolNode');
    expect(workflowConfig).toHaveProperty('prompts');
    expect(workflowConfig).toHaveProperty('llms');

    // Check LLM instances
    expect(workflowConfig.llms).toHaveProperty('decision');
    expect(workflowConfig.llms).toHaveProperty('analyze');
    expect(workflowConfig.llms).toHaveProperty('generation');
    expect(workflowConfig.llms).toHaveProperty('response');
  });

  it('should create workflow with all required nodes', async () => {
    const nodes = await createNodes(workflowConfig);
    const workflow = await createWorkflow(nodes);

    expect(workflow).toBeDefined();

    // Check that all required nodes are present
    const workflowNodes = (workflow as any).nodes;
    expect(workflowNodes).toHaveProperty('collectDataNode');
    expect(workflowNodes).toHaveProperty('summaryNode');
    expect(workflowNodes).toHaveProperty('engagementNode');
    expect(workflowNodes).toHaveProperty('analyzeTrendNode');
    expect(workflowNodes).toHaveProperty('generateTweetNode');
    expect(workflowNodes).toHaveProperty('uploadToDsnNode');

    // Check workflow edges
    const edges = (workflow as any).edges;
    expect(edges).toBeInstanceOf(Set);
    expect(edges).toContainEqual(['__start__', 'collectDataNode']);
    expect(edges).toContainEqual(['collectDataNode', 'summaryNode']);
    expect(edges).toContainEqual(['summaryNode', 'engagementNode']);
    expect(edges).toContainEqual(['engagementNode', 'analyzeTrendNode']);
    expect(edges).toContainEqual(['analyzeTrendNode', 'generateTweetNode']);
  });

  // Test State annotations
  describe('State Annotations', () => {
    it('should properly initialize state', () => {
      const state = createMockState();

      expect(state.messages).toEqual([]);
      expect(state.timelineTweets).toBeInstanceOf(Set);
      expect(state.mentionsTweets).toBeInstanceOf(Set);
      expect(state.processedTweetIds).toBeInstanceOf(Set);
    });

    it('should prune processed tweet IDs when exceeding limit', () => {
      const state = createMockState();
      state.processedTweetIds = new Set(['1', '2', '3']);
      state.processedTweetIds = new Set(['4', '5']);

      expect(Array.from(state.processedTweetIds)).toEqual(['4', '5']);
      expect(state.processedTweetIds.size).toBe(config.memoryConfig.MAX_PROCESSED_IDS);
    });
  });
});
