import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';

export interface Character {
  name: string;
  characterPath: string;
  goal: string;
  personality: string[];
  expertise: string[];
  frequencyPreferences?: string[];
  communicationRules: {
    rules: string[];
    wordsToAvoid: string[];
  };
}

interface RawCharacterConfig {
  name: string;
  goal: string;
  personality: string[];
  expertise: string[];
  frequency_preferences?: string[];
  communication_rules: {
    rules: string[];
    words_to_avoid: string[];
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
      frequencyPreferences: rawConfig.frequency_preferences,
      communicationRules: {
        ...rawConfig.communication_rules,
        wordsToAvoid: rawConfig.communication_rules.words_to_avoid,
      },
    };
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(`Failed to load character config for '${characterName}': ${error.message}`);
  }
};
