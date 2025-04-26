import fs from 'fs/promises';
import path from 'path';
import { runCommandWithOutput } from './commands.js';


/**
 * Check if Git is installed and available
 */
const isGitInstalled = async (): Promise<boolean> => {
    try {
      const { code } = await runCommandWithOutput('git --version', process.cwd());
      return code === 0;
    } catch {
      return false;
    }
  };
  

/**
 * Extract user customizations from files that we want to preserve
 */
const extractUserCustomizations = async (projectPath: string): Promise<Record<string, any>> => {
    try {
      // Extract package.json customizations
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Extract README customizations - first heading is usually project name
      const readmePath = path.join(projectPath, 'README.md');
      let readmeContent = '';
      let projectTitle = '';
      
      try {
        readmeContent = await fs.readFile(readmePath, 'utf8');
        // Extract the first heading as project title
        const titleMatch = readmeContent.match(/^#\s+(.+)$/m);
        if (titleMatch && titleMatch[1]) {
          projectTitle = titleMatch[1];
        }
      } catch (error) {
        // README might not exist, that's ok
      }
      
      return {
        packageName: packageJson.name,
        packageVersion: packageJson.version,
        packageDescription: packageJson.description || '',
        projectTitle,
        readmeContent
      };
    } catch (error) {
      throw new Error(`Failed to extract user customizations: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  export { extractUserCustomizations, isGitInstalled };