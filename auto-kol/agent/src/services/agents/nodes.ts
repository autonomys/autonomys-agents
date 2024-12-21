import { WorkflowConfig } from './workflow.js';
import { createTwitterClientScraper } from '../twitter/api.js';
import { createSearchNode } from './nodes/searchNode.js';
import { createEngagementNode } from "./nodes/engagementNode.js";
import { createToneAnalysisNode } from "./nodes/toneAnalysisNode.js";
import { createResponseGenerationNode } from "./nodes/responseGenerationNode.js";
import { createRecheckSkippedNode } from "./nodes/recheckSkippedNode.js";
import { createTimelineNode } from "./nodes/timelineNode.js";
import { createMentionNode } from "./nodes/mentionNode.js";
import { createAutoApprovalNode } from './nodes/autoApprovalNode.js';

export const createNodes = async (config: WorkflowConfig) => {

    const scraper = await createTwitterClientScraper();

    ///////////MENTIONS///////////
    const mentionNode = createMentionNode(config);

    ///////////TIMELINE///////////
    const timelineNode = createTimelineNode(config);

    ///////////SEARCH///////////
    const searchNode = createSearchNode(config);

    ///////////ENGAGEMENT///////////
    const engagementNode = createEngagementNode(config);

    ///////////TONE ANALYSIS///////////
    const toneAnalysisNode = createToneAnalysisNode(config);

    ///////////RESPONSE GENERATION///////////
    const responseGenerationNode = createResponseGenerationNode(config, scraper);

    ///////////RECHECK SKIPPED///////////
    const recheckSkippedNode = createRecheckSkippedNode(config);

    ///////////AUTO APPROVAL///////////
    const autoApprovalNode = createAutoApprovalNode(config, scraper);

    return {
        mentionNode,
        timelineNode,
        searchNode,
        engagementNode,
        toneAnalysisNode,
        responseGenerationNode,
        recheckSkippedNode,
        autoApprovalNode
    };
};