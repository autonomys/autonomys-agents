import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { runCommandWithOutput, runCommand } from './commands.js';

/**
 * Initialize Git repository if not already initialized
 */
const initializeGitIfNeeded = async (
    projectPath: string, 
    spinner: ReturnType<typeof ora>
  ): Promise<boolean> => {
    try {
      // Check if .git directory exists
      const gitDirPath = path.join(projectPath, '.git');
      try {
        const gitDirStats = await fs.stat(gitDirPath);
        if (gitDirStats.isDirectory()) {
          // Git already initialized
          return true;
        }
      } catch {
        // .git directory doesn't exist, initialize Git
        spinner.text = 'Initializing Git repository...';
        await runCommand('git init', projectPath, spinner);
        return true;
      }
      
      return true;
    } catch (error) {
      throw new Error(`Failed to initialize Git repository: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  /**
   * Setup template remote if it doesn't exist
   */
  const setupTemplateRemote = async (
    projectPath: string,
    spinner: ReturnType<typeof ora>
  ): Promise<void> => {
    try {
      // Check if template remote exists
      const { stdout: remotes } = await runCommandWithOutput('git remote', projectPath);
      const remoteList = remotes.split('\n');
      
      if (!remoteList.includes('template')) {
        // Add template remote
        spinner.text = 'Setting up template remote...';
        await runCommand(
          'git remote add template https://github.com/autonomys/autonomys-agent-template.git', 
          projectPath, 
          spinner
        );
      }
    } catch (error) {
      throw new Error(`Failed to setup template remote: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  /**
   * Commit current changes if there are any
   */
  const commitCurrentChanges = async (
    projectPath: string,
    spinner: ReturnType<typeof ora>
  ): Promise<boolean> => {
    try {
      // Check if there are uncommitted changes
      const { stdout: status } = await runCommandWithOutput('git status --porcelain', projectPath);
      
      if (status.trim() !== '') {
        // There are uncommitted changes
        spinner.text = 'Committing current changes before update...';
        
        // Add all changes
        await runCommand('git add .', projectPath, spinner);
        
        // Commit changes
        await runCommand(
          'git commit -m "Auto-commit before template update"', 
          projectPath, 
          spinner
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      throw new Error(`Failed to commit changes: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  export { initializeGitIfNeeded, setupTemplateRemote, commitCurrentChanges };