import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';
import { Character, RawCharacterConfig } from './types.js';

export const loadCharacter = (characterName: string, workspaceRoot: string): Character => {
  const characterPath = join(workspaceRoot, 'characters', `${characterName}`);
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
