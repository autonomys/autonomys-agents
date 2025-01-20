import { createEngagementNode } from '../../../../../src/agents/workflows/twitter/nodes/engagementNode';
import { TwitterWorkflowConfig } from '../../../../../src/agents/workflows/twitter/types';
import { createMockState, createMockTweet } from '../__fixtures__/mockState';

describe('Engagement Node', () => {
  let mockWorkflowConfig: TwitterWorkflowConfig;
  let mockState: ReturnType<typeof createMockState>;

  beforeEach(() => {
    mockWorkflowConfig = {
      llms: {
        decision: {
          pipe: jest.fn().mockReturnThis(),
          invoke: jest.fn().mockResolvedValue({
            shouldEngage: true,
            reason: 'Test reason',
          }),
        },
      },
      prompts: {
        engagementPrompt: {
          format: jest.fn().mockResolvedValue('formatted prompt'),
        },
      },
    } as any;
    mockState = createMockState();
  });

  it('should evaluate tweets and return engagement decisions', async () => {
    const engagementNode = createEngagementNode(mockWorkflowConfig);
    const testTweet = createMockTweet();
    mockState.mentionsTweets.add(testTweet);

    const result = await engagementNode(mockState);

    expect(result).toHaveProperty('engagementDecisions');
    const decisions = result.engagementDecisions!;
    expect(Array.isArray(decisions)).toBe(true);
    expect(decisions.length).toBe(1);
    expect(decisions[0]).toHaveProperty('decision');
    expect(decisions[0]).toHaveProperty('tweet');
  });

  it('should skip already processed tweets', async () => {
    const engagementNode = createEngagementNode(mockWorkflowConfig);

    const testTweet = createMockTweet();

    mockState.mentionsTweets = new Set([testTweet]);
    mockState.processedTweetIds = new Set([testTweet.id || '']);

    const result = await engagementNode(mockState);

    expect(result.engagementDecisions).toHaveLength(0);
  });

  it('should handle errors gracefully', async () => {
    mockWorkflowConfig.llms.decision.invoke = jest.fn().mockRejectedValue(new Error('Test error'));
    const engagementNode = createEngagementNode(mockWorkflowConfig);

    const testTweet = createMockTweet();

    mockState.mentionsTweets = new Set([testTweet]);

    const result = await engagementNode(mockState);

    expect(result).toHaveProperty('messages');
    expect(Array.isArray(result.messages)).toBe(true);
    expect(result.messages).toHaveLength(0);
  });

  it('should handle negative engagement decisions', async () => {
    // Override the default mock to return shouldEngage: false
    mockWorkflowConfig.llms.decision.invoke = jest.fn().mockResolvedValue({
      shouldEngage: false,
      reason: 'Not relevant to my interests',
    });

    const engagementNode = createEngagementNode(mockWorkflowConfig);
    const testTweet = createMockTweet();
    mockState.mentionsTweets.add(testTweet);

    const result = await engagementNode(mockState);

    expect(result).toHaveProperty('engagementDecisions');
    const decisions = result.engagementDecisions!;
    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toEqual({
      decision: {
        shouldEngage: false,
        reason: 'Not relevant to my interests',
      },
      tweet: {
        id: testTweet.id,
        text: testTweet.text,
        username: testTweet.username,
        timeParsed: testTweet.timeParsed,
      },
    });
  });

  it('should process multiple tweets with mixed engagement decisions', async () => {
    // Mock LLM to alternate between positive and negative decisions
    mockWorkflowConfig.llms.decision.invoke = jest
      .fn()
      .mockResolvedValueOnce({
        shouldEngage: true,
        reason: 'Relevant discussion',
      })
      .mockResolvedValueOnce({
        shouldEngage: false,
        reason: 'Off-topic',
      });

    const engagementNode = createEngagementNode(mockWorkflowConfig);
    const tweet1 = createMockTweet({ id: '1', text: 'First tweet' });
    const tweet2 = createMockTweet({ id: '2', text: 'Second tweet' });

    mockState.mentionsTweets = new Set([tweet1, tweet2]);

    const result = await engagementNode(mockState);

    expect(result.engagementDecisions).toHaveLength(2);
    expect(result.engagementDecisions![0].decision.shouldEngage).toBe(true);
    expect(result.engagementDecisions![1].decision.shouldEngage).toBe(false);
  });
});
