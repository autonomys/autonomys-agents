import { ChatOpenAI } from '@langchain/openai';
import { AgentResponse, Context } from '../../types/agent';
import { Tweet } from '../../types/twitter';
import { createLogger } from '../../utils/logger';
import { config } from '../../config/index';

const logger = createLogger('auto-kol-agent');

type AnalysisResult = Readonly<{
    topic: string;
    stance: string;
    keyPoints: readonly string[];
    controversialAngles: readonly string[];
}>;

const model = new ChatOpenAI({
    modelName: config.LLM_MODEL,
    temperature: config.TEMPERATURE,
});

const createAnalysisPrompt = (tweet: Tweet): string => `
Analyze this tweet and identify:
1. The main topic
2. The author's stance
3. Key points made
4. Potential controversial angles

Tweet: "${tweet.text}"
`;

const parseAnalysisResponse = (response: string): AnalysisResult => {
    // Simple parser - could be made more robust
    const [topic, stance, points, angles] = response.split('\n\n');
    return {
        topic: topic.replace('Topic: ', ''),
        stance: stance.replace('Stance: ', ''),
        keyPoints: points.replace('Key Points: ', '').split(', '),
        controversialAngles: angles.replace('Controversial Angles: ', '').split(', ')
    };
};

const analyzeContext = async (context: Context): Promise<AnalysisResult> => {
    try {
        const prompt = createAnalysisPrompt(context.tweet);
        const response = await model.invoke(prompt);
        return parseAnalysisResponse(String(response.content));
    } catch (error) {
        logger.error('Error analyzing context:', error);
        throw error;
    }
};

const selectResponseAngle = (
    analysis: AnalysisResult,
    previousInteractions: readonly AgentResponse[]
): string => {
    const unusedAngles = analysis.controversialAngles.filter(angle =>
        !previousInteractions.some(interaction =>
            interaction.content.includes(angle)
        )
    );
    return unusedAngles[0] || analysis.controversialAngles[0];
};

const createResponsePrompt = (
    analysis: AnalysisResult,
    angle: string
): string => `
Create a thought-provoking response to a tweet about ${analysis.topic}.
Use this controversial angle: ${angle}

Requirements:
1. Be respectful but challenging
2. Support your argument with logic
3. Keep it under 280 characters
4. End with a question to encourage engagement

Context:
- Topic: ${analysis.topic}
- Original Stance: ${analysis.stance}
- Key Points: ${analysis.keyPoints.join(', ')}
`;

const determineResponseSentiment = (
    originalStance: string,
    responseAngle: string
): 'agree' | 'disagree' | 'neutral' => {
    // Simple heuristic - could be made more sophisticated
    if (responseAngle.includes('counter') || responseAngle.includes('opposite')) {
        return 'disagree';
    }
    if (responseAngle.includes('support') || responseAngle.includes('extend')) {
        return 'agree';
    }
    return 'neutral';
};

const generateResponse = async (
    analysis: AnalysisResult,
    previousInteractions: readonly AgentResponse[]
): Promise<AgentResponse> => {
    try {
        const responseAngle = selectResponseAngle(analysis, previousInteractions);
        const prompt = createResponsePrompt(analysis, responseAngle);
        const response = await model.invoke(prompt);

        return {
            content: String(response.content),
            sentiment: determineResponseSentiment(analysis.stance, responseAngle),
            confidence: 0.85,
            references: analysis.keyPoints
        };
    } catch (error) {
        logger.error('Error generating response:', error);
        throw error;
    }
};

export const handleTweet = async (
    tweet: Tweet,
    previousInteractions: readonly AgentResponse[] = []
): Promise<AgentResponse> => {
    try {
        const context = { tweet, previousInteractions };
        const analysis = await analyzeContext(context);
        return await generateResponse(analysis, previousInteractions);
    } catch (error) {
        logger.error('Error handling tweet:', error);
        throw error;
    }
}; 