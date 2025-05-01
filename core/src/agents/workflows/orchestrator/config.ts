import { Character } from '../../../config/types.js';
import { LLMConfiguration, LLMFactoryConfig } from '../../../services/llm/types.js';
import { createLogger } from '../../../utils/logger.js';
import { createPrompts } from './prompts.js';
import { createDefaultOrchestratorTools } from './tools.js';
import {
  ApiConfig,
  CharacterDataPathConfig,
  ExperienceConfig,
  ModelConfigurations,
  MonitoringConfig,
  OrchestratorConfig,
  OrchestratorRunnerOptions,
  PruningParameters,
  Tools,
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
 * Helper function to create an ApiConfig based on user options
 */
export const createApiConfig = (options?: OrchestratorRunnerOptions): ApiConfig => {
  return {
    apiEnabled: options?.apiConfig?.apiEnabled ?? false,
    authFlag: options?.apiConfig?.authFlag ?? false,
    authToken: options?.apiConfig?.authToken ?? '',
    allowedOrigins: options?.apiConfig?.allowedOrigins ?? [],
    port: options?.apiConfig?.port ?? 3000,
  };
};

/**
 * Helper function to create an LLMConfig based on user options
 */
export const createLLMConfig = (options?: OrchestratorRunnerOptions): LLMFactoryConfig => {
  return {
    OPENAI_API_KEY: options?.llmConfig?.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: options?.llmConfig?.ANTHROPIC_API_KEY,
    LLAMA_API_URL: options?.llmConfig?.LLAMA_API_URL,
    DEEPSEEK_API_KEY: options?.llmConfig?.DEEPSEEK_API_KEY,
    DEEPSEEK_URL: options?.llmConfig?.DEEPSEEK_URL,
    GROQ_API_KEY: options?.llmConfig?.GROQ_API_KEY,
  };
};

export const createStopCounterLimit = (options?: OrchestratorRunnerOptions): number => {
  return options?.stopCounterLimit ?? 3;
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
  const apiConfig = createApiConfig(options);
  const llmConfig = createLLMConfig(options);
  const stopCounterLimit = createStopCounterLimit(options);
  // Get tools - merge custom tools with defaults if experience saving is enabled
  const tools: Tools = [
    ...(options?.tools || []),
    ...createDefaultOrchestratorTools(
      baseConfig.namespace,
      llmConfig,
      characterDataPathConfig.dataPath,
      experienceConfig.saveExperiences ? experienceConfig.experienceManager : undefined,
    ),
  ];

  // Get prompts - use custom or default
  const prompts = options?.prompts || (await createPrompts(character));

  // Return the complete configuration
  return {
    characterName: character.name,
    ...baseConfig,
    modelConfigurations,
    tools,
    prompts,
    pruningParameters,
    experienceConfig,
    monitoringConfig,
    characterDataPathConfig,
    apiConfig,
    llmConfig,
    stopCounterLimit,
  };
};
