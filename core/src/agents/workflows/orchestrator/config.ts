import { Character } from '../../../config/characters.js';
import { LLMConfiguration } from '../../../services/llm/types.js';
import { createLogger } from '../../../utils/logger.js';
import { createPrompts } from './prompts.js';
import { createDefaultOrchestratorTools } from './tools.js';
import {
  ExperienceConfig,
  ModelConfigurations,
  MonitoringConfig,
  OrchestratorConfig,
  OrchestratorRunnerOptions,
  PruningParameters,
  Tools,
  CharacterDataPathConfig,
} from './types.js';

/**
 * Default model configuration used by orchestrator workflows
 */
export const defaultModelConfiguration: LLMConfiguration = {
  provider: 'anthropic',
  model: 'claude-3-5-haiku-latest',
  temperature: 0.8,
};

/**
 * Default pruning parameters that determine how/when messages are summarized
 */
export const defaultPruningParameters: PruningParameters = {
  maxWindowSummary: 30,
  maxQueueSize: 50,
};

/**
 * Default model configurations for various workflow steps
 */
export const defaultModelConfigurations: ModelConfigurations = {
  inputModelConfig: defaultModelConfiguration,
  messageSummaryModelConfig: defaultModelConfiguration,
  finishWorkflowModelConfig: defaultModelConfiguration,
};

/**
 * Default experience configuration - disabled by default
 */
export const defaultExperienceConfig: ExperienceConfig = {
  saveExperiences: false,
};

/**
 * Default monitoring configuration - disabled by default
 */
export const defaultMonitoringConfig: MonitoringConfig = {
  enabled: false,
};

/**
 * Default orchestrator options
 */
export const defaultOrchestratorOptions = {
  modelConfigurations: defaultModelConfigurations,
  namespace: 'orchestrator',
  pruningParameters: defaultPruningParameters,
  experienceConfig: defaultExperienceConfig,
  monitoringConfig: defaultMonitoringConfig,
  recursionLimit: 50,
};

/**
 * Helper function to create a properly typed ExperienceConfig based on user options
 */
export const createExperienceConfig = (options?: OrchestratorRunnerOptions): ExperienceConfig => {
  if (
    options?.experienceConfig?.saveExperiences === true &&
    options.experienceConfig.experienceManager
  ) {
    return {
      saveExperiences: true as const,
      experienceManager: options.experienceConfig.experienceManager,
    };
  } else {
    return {
      saveExperiences: false as const,
    };
  }
};

/**
 * Helper function to create a properly typed MonitoringConfig based on user options
 */
export const createMonitoringConfig = (options?: OrchestratorRunnerOptions): MonitoringConfig => {
  if (
    options?.monitoringConfig?.enabled === true &&
    options.monitoringConfig.monitoringExperienceManager
  ) {
    return {
      enabled: true as const,
      monitoringExperienceManager: options.monitoringConfig.monitoringExperienceManager,
      messageCleaner: options.monitoringConfig.messageCleaner,
    };
  } else {
    return {
      enabled: false as const,
    };
  }
};

/**
 * Helper function to merge model configurations with defaults
 */
export const createModelConfigurations = (
  options?: OrchestratorRunnerOptions,
): ModelConfigurations => {
  return {
    inputModelConfig:
      options?.modelConfigurations?.inputModelConfig ?? defaultModelConfigurations.inputModelConfig,
    messageSummaryModelConfig:
      options?.modelConfigurations?.messageSummaryModelConfig ??
      defaultModelConfigurations.messageSummaryModelConfig,
    finishWorkflowModelConfig:
      options?.modelConfigurations?.finishWorkflowModelConfig ??
      defaultModelConfigurations.finishWorkflowModelConfig,
  };
};

/**
 * Helper function to merge pruning parameters with defaults
 */
export const createPruningParameters = (options?: OrchestratorRunnerOptions): PruningParameters => {
  return {
    ...defaultPruningParameters,
    ...options?.pruningParameters,
  };
};

/**
 * Helper function to get the character path for data storage
 */
export const createCharacterDataPathConfig = (
  options?: OrchestratorRunnerOptions,
): CharacterDataPathConfig => {
  return {
    dataPath: options?.characterDataPathConfig?.dataPath || process.cwd(),
  };
};

/**
 * Creates a configuration object for an orchestrator runner
 * This handles all the merging of defaults with provided options
 */
export const createOrchestratorConfig = async (
  character: Character,
  options?: OrchestratorRunnerOptions,
): Promise<OrchestratorConfig> => {
  // Base configuration options
  const baseConfig = {
    namespace: options?.namespace ?? defaultOrchestratorOptions.namespace,
    recursionLimit: options?.recursionLimit ?? defaultOrchestratorOptions.recursionLimit,
    logger: options?.logger ?? createLogger(`orchestrator-${options?.namespace ?? 'default'}`),
  };

  // Create the specialized configurations with proper type handling
  const modelConfigurations = createModelConfigurations(options);
  const experienceConfig = createExperienceConfig(options);
  const monitoringConfig = createMonitoringConfig(options);
  const pruningParameters = createPruningParameters(options);
  const characterDataPathConfig = createCharacterDataPathConfig(options);

  // Get tools - merge custom tools with defaults if experience saving is enabled
  const tools: Tools = [
    ...(options?.tools || []),
    ...createDefaultOrchestratorTools(
      baseConfig.namespace,
      experienceConfig.saveExperiences ? experienceConfig.experienceManager : undefined,
    ),
  ];

  // Get prompts - use custom or default
  const prompts = options?.prompts || (await createPrompts(character));

  // Return the complete configuration
  return {
    ...baseConfig,
    modelConfigurations,
    tools,
    prompts,
    pruningParameters,
    experienceConfig,
    monitoringConfig,
    characterDataPathConfig,
  };
};
