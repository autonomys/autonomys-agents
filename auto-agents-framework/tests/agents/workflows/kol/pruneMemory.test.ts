import { createMockState } from './__fixtures__/mockState';
import { pruneProcessedIds } from '../../../../src/agents/workflows/kol/memoryPruner';
import { config } from '../../../../src/config/index';

describe('Memory Pruning', () => {
  let mockState: ReturnType<typeof createMockState>;

  beforeEach(() => {
    mockState = createMockState();
    jest.clearAllMocks();
  });

  it('should prune processed IDs according to memory config', () => {
    const processedIds = new Set(['1', '2', '3', '4', '5']);
    const prunedIds = pruneProcessedIds(processedIds);
    expect(prunedIds.size).toBe(config.memoryConfig.MAX_PROCESSED_IDS);
    expect(Array.from(prunedIds)).toEqual(['4', '5']);
  });

  it('should not prune if under the limit', () => {
    jest.replaceProperty(config.memoryConfig, 'MAX_PROCESSED_IDS', 5);
    const processedIds = new Set(['1', '2']);
    const prunedIds = pruneProcessedIds(processedIds);
    expect(prunedIds.size).toBe(2);
    expect(Array.from(prunedIds)).toEqual(['1', '2']);
  });

  it('should handle empty sets', () => {
    const processedIds = new Set<string>();
    const prunedIds = pruneProcessedIds(processedIds);

    expect(prunedIds.size).toBe(0);
    expect(Array.from(prunedIds)).toEqual([]);
  });

  it('should maintain order of IDs when pruning', () => {
    const processedIds = new Set(['1', '2', '3', '4']);
    const prunedIds = pruneProcessedIds(processedIds);
    expect(Array.from(prunedIds)).toEqual(['3', '4']);
  });
});
