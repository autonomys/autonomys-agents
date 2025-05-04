import { createArxivSearchTool } from '../tools/arxiv/index.js';

const arxivSearchTool = createArxivSearchTool();

const defaultTools = [arxivSearchTool];

export { defaultTools };
