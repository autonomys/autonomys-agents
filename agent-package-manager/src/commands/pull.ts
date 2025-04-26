import chalk from 'chalk';
import ora from 'ora';
import { CommandResult, PullOptions } from '../types/index.js';
import { updateTemplate } from '../utils/commands/pull/index.js';
import { detectProjectRoot } from '../utils/shared/path.js';
/**
 * Update the agent project template to the latest version
 */
const pull = async (options: PullOptions = {}): Promise<CommandResult> => {
  const spinner = ora('Pulling agent project template...').start();

  try {
    const projectPath = (await detectProjectRoot())?.root;
    if (!projectPath) {
      spinner.fail('Failed to detect project root');
      return {
        success: false,
        message: 'Failed to detect project root',
      };
    }

    // Update template
    const updateResult = await updateTemplate(projectPath, spinner, options.force);
    
    if (updateResult.hasChanges) {
      if (updateResult.conflicts) {
        spinner.succeed('Template updated partially - some conflicts remain');
        console.log(`\n${chalk.yellow('Some conflicts could not be automatically resolved:')}`);
        
        // Get the list of remaining conflicts if available
        if (updateResult.remainingConflicts && updateResult.remainingConflicts.length > 0) {
          console.log(chalk.cyan('  Files with remaining conflicts:'));
          updateResult.remainingConflicts.forEach((file: string) => {
            console.log(chalk.cyan(`  - ${file}`));
          });
        }
        
        console.log('\nPlease resolve these conflicts manually:');
        console.log(chalk.cyan('  1. Run: git status (to see conflicted files)'));
        console.log(chalk.cyan('  2. Edit each file to resolve conflicts (look for <<<<<<< markers)'));
        console.log(chalk.cyan('  3. Run: git add <file> (for each resolved file)'));
        console.log(chalk.cyan('  4. Run: git commit -m "Resolved template conflicts"'));
      } else {
        spinner.succeed('Template updated successfully');
        console.log(`\n${chalk.green('Update completed successfully!')}`);
        console.log(chalk.cyan('  The template has been updated to the latest version.'));
        console.log(chalk.cyan('  Your customizations (project name, version, etc.) have been preserved.'));
      }
    } else {
      spinner.succeed('Template is already up to date');
    }

    return {
      success: true,
      message: 'Template update process completed',
    };
  } catch (error) {
    spinner.fail('Failed to update template');
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(errorMessage));

    return {
      success: false,
      message: `Failed to update template: ${errorMessage}`,
    };
  }
};

export { pull }; 