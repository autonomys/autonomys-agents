import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';

export interface Character {
  name: string;
  characterPath: string;
  description: string;
  personality: string[];
  expertise: string[];
  communicationRules: {
    rules: string[];
    wordsToAvoid: string[];
  };
  twitterProfile: {
    username: string;
    trendFocus: string[];
    contentFocus: string[];
    engagementCriteria: string[];
    replyStyle: string[];
  };
}

interface RawCharacterConfig {
  name: string;
  description: string;
  personality: string[];
  expertise: string[];
  communication_rules: {
    rules: string[];
    words_to_avoid: string[];
  };
  twitter_profile: {
    username: string;
    trend_focus: string[];
    content_focus: string[];
    engagement_criteria: string[];
    reply_style: string[];
  };
}

export const loadCharacter = (characterName: string): Character => {
  const characterPath = join(process.cwd(), 'characters', `${characterName}`);
  const configPath = join(characterPath, 'config', `${characterName}.yaml`);
  try {
    const yamlContent = readFileSync(configPath, 'utf8');
    const rawConfig = load(yamlContent) as RawCharacterConfig;

    return {
      ...rawConfig,
      characterPath,
      communicationRules: {
        ...rawConfig.communication_rules,
        wordsToAvoid: rawConfig.communication_rules.words_to_avoid,
      },
      twitterProfile: {
        ...rawConfig.twitter_profile,
        trendFocus: rawConfig.twitter_profile.trend_focus,
        contentFocus: rawConfig.twitter_profile.content_focus,
        engagementCriteria: rawConfig.twitter_profile.engagement_criteria,
        replyStyle: rawConfig.twitter_profile.reply_style,
      },
    };
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(`Failed to load character config for '${characterName}': ${error.message}`);
  }
};
