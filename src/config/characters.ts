import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';

export interface Character {
  name: string;
  username: string;
  description: string;
  personality: string[];
  expertise: string[];
  rules: string[];
  trendFocus: string[];
  contentFocus: string[];
  engagementCriteria: string[];
  replyStyle: string[];
  wordsToAvoid: string[];
}

interface RawCharacterConfig {
  name: string;
  username: string;
  description: string;
  personality: string[];
  expertise: string[];
  rules: string[];
  trend_focus: string[];
  content_focus: string[];
  engagement_criteria: string[];
  reply_style: string[];
  words_to_avoid: string[];
}

export const loadCharacter = (characterId: string): Character => {
  const cleanCharacterId = characterId.replace(/\.(ya?ml)$/, '').toLowerCase();
  const configPath = join(process.cwd(), 'config', 'characters', `${cleanCharacterId}.yaml`);

  try {
    const yamlContent = readFileSync(configPath, 'utf8');
    const rawConfig = load(yamlContent) as RawCharacterConfig;

    return {
      ...rawConfig,
      trendFocus: rawConfig.trend_focus,
      contentFocus: rawConfig.content_focus,
      engagementCriteria: rawConfig.engagement_criteria,
      replyStyle: rawConfig.reply_style,
      wordsToAvoid: rawConfig.words_to_avoid,
    };
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(`Failed to load character config for '${cleanCharacterId}': ${error.message}`);
  }
};
