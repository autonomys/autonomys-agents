import { config } from './config/index.js';
import { createLogger } from './utils/logger.js';
import { runWorkflow } from './agents/workflows/kol/workflow.js';
import inquirer from 'inquirer';

const logger = createLogger('app');

// Add process ID and timestamp to track instances
const instanceId = `${process.pid}-${Date.now()}`;
logger.info(`Process instance started: ${instanceId}`);

interface UserAnswers {
  name: string;
  projectType: string;
  features: string[];
}

const onboarding = async () => {
  const answers: UserAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'What is your project name?',
      default: 'my-awesome-project'
    },
    {
      type: 'list',
      name: 'projectType',
      message: 'What type of project do you want to create?',
      choices: [
        'Frontend (React)',
        'Backend (Node.js)',
        'Full Stack',
        'Library'
      ]
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select additional features:',
      choices: [
        'TypeScript Configuration',
        'ESLint',
        'Prettier',
        'Jest Testing',
        'GitHub Actions',
        'Docker Setup'
      ]
    }
  ]);

  console.log('\nProject Configuration:');
  console.log('=====================');
  console.log(`Project Name: ${answers.name}`);
  console.log(`Project Type: ${answers.projectType}`);
  console.log('Selected Features:', answers.features.join(', '));
};

// Get character name from command line args
const characterId = process.argv[2];
if (!characterId) {
  logger.error('Please provide a character name as an argument (e.g., yarn dev argumint)');
  process.exit(1);
}

// Strip any file extension
const cleanCharacterId = characterId.replace(/\.(ya?ml)$/, '');

const startWorkflowPolling = async () => {
  try {
    const _result = await runWorkflow(cleanCharacterId);
    logger.info('Workflow execution completed successfully');
  } catch (error) {
    logger.error('Error running workflow:', error);
  }
};

const main = async () => {
  try {
    await onboarding();
    // await startWorkflowPolling();
    // setInterval(startWorkflowPolling, config.twitterConfig.RESPONSE_INTERVAL_MS);

    // logger.info('Application started successfully', {
    //   checkInterval: config.twitterConfig.RESPONSE_INTERVAL_MS / 1000 / 60,
    //   username: config.twitterConfig.USERNAME,
    // });
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
};

main();
