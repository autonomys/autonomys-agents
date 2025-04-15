/**
 * Example of using autonomys/agent-core in a project
 */

import {
    // Configuration
    getConfig,
    
    // Agent creation
    createOrchestratorRunner,
    createPrompts,
    registerOrchestratorRunner,
    
    // Default Tools
    createAllSchedulerTools,
    createTwitterApi,
    
    createTwitterAgent,
    
    // Orchestrator
    startTaskExecutor,
    
    // Types
    type OrchestratorRunner,
    type ModelConfigurations,
    type OrchestratorRunnerOptions,
    type LLMConfiguration,
    
    // API
    createApiServer,
    withApiLogger,
    type CreateApiServerParams,
    
    // Config & Utils
    createExperienceManager,
    createLogger,

    setupSignalHandlers
  
  } from '@autonomys/agent-core';
    
  // Get the config instance
  const configInstance = await getConfig();
  if (!configInstance) {
    throw new Error('Config instance not found');
  }
  const { config, agentVersion, characterName } = configInstance;
  
  export const bigModel: LLMConfiguration = {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-latest',
    temperature: 0.6,
  };
  export const smallModel: LLMConfiguration = {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-latest',
    temperature: 0.6,
  };
  export const modelConfigurations: ModelConfigurations = {
    inputModelConfig: bigModel,
    messageSummaryModelConfig: smallModel,
    finishWorkflowModelConfig: smallModel,
  };
  
  const character = config.characterConfig;
  const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
    //shared config
    const dataPath = character.characterPath;
  
    let apiConfig: OrchestratorRunnerOptions['apiConfig'] | undefined;
    if (config.ENABLE_API) {
      apiConfig = {
        apiEnabled: true,
        authFlag: config.apiSecurityConfig.ENABLE_AUTH,
        authToken: config.apiSecurityConfig.API_TOKEN,
        allowedOrigins: config.apiSecurityConfig.CORS_ALLOWED_ORIGINS,
        port: config.API_PORT,
      };
      const createApiServerParams: CreateApiServerParams = {
        characterName,
        dataPath,
        authFlag: apiConfig.authFlag ?? false,
        authToken: apiConfig.authToken ?? '',
        apiPort: apiConfig.port ?? 3000,
        allowedOrigins: apiConfig.allowedOrigins ?? [],
        llmConfig: config.llmConfig,
      };
      const _apiServer = createApiServer(createApiServerParams);
    }
  
    const saveExperiences = config.autoDriveConfig.AUTO_DRIVE_SAVE_EXPERIENCES;
    const monitoringEnabled = config.autoDriveConfig.AUTO_DRIVE_MONITORING;
    const experienceManager =
      (saveExperiences || monitoringEnabled) &&
      config.blockchainConfig.PRIVATE_KEY &&
      config.blockchainConfig.RPC_URL &&
      config.blockchainConfig.CONTRACT_ADDRESS &&
      config.autoDriveConfig.AUTO_DRIVE_API_KEY
        ? await createExperienceManager({
            autoDriveApiOptions: {
              apiKey: config.autoDriveConfig.AUTO_DRIVE_API_KEY,
              network: config.autoDriveConfig.AUTO_DRIVE_NETWORK,
            },
            uploadOptions: {
              compression: true,
              password: config.autoDriveConfig.AUTO_DRIVE_ENCRYPTION_PASSWORD,
            },
            walletOptions: {
              privateKey: config.blockchainConfig.PRIVATE_KEY,
              rpcUrl: config.blockchainConfig.RPC_URL,
              contractAddress: config.blockchainConfig.CONTRACT_ADDRESS,
            },
            agentOptions: {
              agentVersion: agentVersion,
              agentName: characterName,
              agentPath: character.characterPath,
            },
          })
        : undefined;
  
    const experienceConfig =
      saveExperiences && experienceManager
        ? {
            saveExperiences: true as const,
            experienceManager,
          }
        : {
            saveExperiences: false as const,
          };
  
    const monitoringConfig =
      monitoringEnabled && experienceManager
        ? {
            enabled: true as const,
            monitoringExperienceManager: experienceManager,
          }
        : {
            enabled: false as const,
          };
  
    const schedulerTools = createAllSchedulerTools();
    // Twitter agent config
    const twitterAgentTool =
      config.twitterConfig.USERNAME && config.twitterConfig.PASSWORD
        ? [
            createTwitterAgent(
              await createTwitterApi(
                config.twitterConfig.USERNAME,
                config.twitterConfig.PASSWORD,
                config.twitterConfig.COOKIES_PATH,
              ),
              character,
              {
                tools: [...schedulerTools],
                postTweets: config.twitterConfig.POST_TWEETS,
                experienceConfig,
                monitoringConfig,
                modelConfigurations: config.twitterConfig.model_configurations,
                characterDataPathConfig: {
                  dataPath,
                },
                apiConfig,
              },
            ),
          ]
        : [];
  
    // Orchestrator config
    const prompts = await createPrompts(character);
  
    return {
      modelConfigurations: config.orchestratorConfig.model_configurations,
      tools: [
        ...twitterAgentTool,
        ...schedulerTools,
      ],
      prompts,
      experienceConfig:
        saveExperiences && experienceManager
          ? { saveExperiences: true, experienceManager }
          : { saveExperiences: false },
      monitoringConfig:
        monitoringEnabled && experienceManager
          ? {
              enabled: true,
              monitoringExperienceManager: experienceManager,
            }
          : {
              enabled: false,
            },
      characterDataPathConfig: {
        dataPath,
      },
      apiConfig,
      llmConfig: config.llmConfig,
    };
  };
  
  const orchestrationConfig = await orchestratorConfig();
  export const orchestratorRunner = (() => {
    let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
    return async () => {
      if (!runnerPromise) {
        const namespace = 'orchestrator';
        runnerPromise = createOrchestratorRunner(character, {
          ...orchestrationConfig,
          ...withApiLogger(namespace, orchestrationConfig.apiConfig ? true : false),
        });
        const runner = await runnerPromise;
        registerOrchestratorRunner(namespace, runner);
      }
      return runnerPromise;
    };
  })();
  
  
  // Main function to run the application
  const main = async () => {
    try {
      const logger = createLogger('app');
      logger.info('Initializing orchestrator runner...');
      const runner = await orchestratorRunner();
  
      logger.info('Starting task executor...');
      const _stopTaskExecutor = startTaskExecutor(runner, 'orchestrator');
  
      logger.info('Application initialized and ready to process scheduled tasks');
      return new Promise(() => {});
    } catch (error) {
      const logger = createLogger('app');
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ExitPromptError') {
        logger.info('Process terminated by user');
        process.exit(0);
      }
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  };

  setupSignalHandlers();

  // Run the application
  main(); 