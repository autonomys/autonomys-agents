import { Config } from './config.js';

export type ConfigOptions = {
  characterName: string;
  customWorkspaceRoot: string;
  isHeadless?: boolean;
};

export type ConfigInstance = {
  config: Config;
  agentVersion: string;
  characterName: string;
  workspaceRoot: string;
};

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

export interface RawCharacterConfig {
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
