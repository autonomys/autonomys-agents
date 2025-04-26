import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { runCommandWithOutput, runCommand } from './commands.js';
/**
 * Intelligently resolve conflicts in common files
 */
const resolveCommonConflicts = async (
    projectPath: string, 
    customizations: Record<string, any>,
    spinner: ReturnType<typeof ora>
  ): Promise<{ fullyResolved: boolean; remainingConflicts: string[] }> => {
    try {
      // Check which files have conflicts
      const { stdout: conflictingFiles } = await runCommandWithOutput(
        'git diff --name-only --diff-filter=U',
        projectPath
      );
      
      const filesArray = conflictingFiles.split('\n').filter(Boolean);
      const handledFiles: string[] = [];
      
      // Handle each potential conflict file
      for (const file of filesArray) {
        if (file === 'package.json') {
          await resolvePackageJsonConflicts(projectPath, customizations, spinner);
          handledFiles.push(file);
        } else if (file === 'README.md') {
          await resolveReadmeConflicts(projectPath, customizations, spinner);
          handledFiles.push(file);
        } else if (file === '.gitignore') {
          await resolveGitignoreConflicts(projectPath, spinner);
          handledFiles.push(file);
        }
      }
      
      // Get remaining conflicts after our resolution attempts
      const { stdout: remainingConflicts } = await runCommandWithOutput(
        'git diff --name-only --diff-filter=U',
        projectPath
      );
      
      const remainingFilesArray = remainingConflicts.split('\n').filter(Boolean);
      
      // Mark all resolved files
      spinner.text = 'Committing resolved conflicts...';
      
      // Stage the files we handled
      for (const file of handledFiles) {
        await runCommand(`git add "${file}"`, projectPath, spinner);
      }
      
      // If we resolved any conflicts, commit those changes
      if (handledFiles.length > 0) {
        await runCommand(
          'git commit -m "Merged template updates with preserved customizations"',
          projectPath, 
          spinner
        );
      }
      
      return { 
        fullyResolved: remainingFilesArray.length === 0,
        remainingConflicts: remainingFilesArray
      };
    } catch (error) {
      throw new Error(`Failed to resolve conflicts: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  /**
   * Resolve package.json conflicts intelligently
   */
  const resolvePackageJsonConflicts = async (
    projectPath: string,
    customizations: Record<string, any>,
    spinner: ReturnType<typeof ora>
  ): Promise<void> => {
    spinner.text = 'Resolving package.json conflicts...';
    
    try {
      // Get the template version of package.json (their changes)
      const { stdout: templateContent } = await runCommandWithOutput(
        'git show template/main:package.json',
        projectPath
      );
      
      // Parse both versions
      const templatePackage = JSON.parse(templateContent);
      
      // Create merged version
      const mergedPackage = {
        ...templatePackage,
        // Preserve user customizations
        name: customizations.packageName,
        version: customizations.packageVersion,
        description: customizations.packageDescription
      };
      
      // Write merged file
      await fs.writeFile(
        path.join(projectPath, 'package.json'),
        JSON.stringify(mergedPackage, null, 2) + '\n'
      );
    } catch (error) {
      throw new Error(`Failed to resolve package.json conflicts: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  /**
   * Resolve README.md conflicts intelligently
   */
  const resolveReadmeConflicts = async (
    projectPath: string,
    customizations: Record<string, any>,
    spinner: ReturnType<typeof ora>
  ): Promise<void> => {
    spinner.text = 'Resolving README.md conflicts...';
    
    try {
      // Get the template version of README.md
      const { stdout: templateContent } = await runCommandWithOutput(
        'git show template/main:README.md',
        projectPath
      );
      
      // Replace the first heading with the user's project title
      let mergedContent = templateContent;
      
      if (customizations.projectTitle) {
        mergedContent = templateContent.replace(/^#\s+.+$/m, `# ${customizations.projectTitle}`);
      }
      
      // Write merged file
      await fs.writeFile(path.join(projectPath, 'README.md'), mergedContent);
    } catch (error) {
      throw new Error(`Failed to resolve README.md conflicts: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  /**
   * Resolve .gitignore conflicts by merging both sets of rules
   */
  const resolveGitignoreConflicts = async (
    projectPath: string,
    spinner: ReturnType<typeof ora>
  ): Promise<void> => {
    spinner.text = 'Resolving .gitignore conflicts...';
    
    try {
      // Get user .gitignore content
      const userGitignorePath = path.join(projectPath, '.gitignore');
      let userContent = '';
      
      try {
        userContent = await fs.readFile(userGitignorePath, 'utf8');
      } catch (error) {
        // User .gitignore might not exist
      }
      
      // Get template .gitignore content
      const { stdout: templateContent } = await runCommandWithOutput(
        'git show template/main:.gitignore',
        projectPath
      );
      
      // Combine ignores without duplicates
      const userLines = userContent.split('\n').filter(Boolean);
      const templateLines = templateContent.split('\n').filter(Boolean);
      
      // Combine and deduplicate
      const mergedLines = [...new Set([...userLines, ...templateLines])];
      
      // Write merged file
      await fs.writeFile(
        userGitignorePath,
        mergedLines.join('\n') + '\n'
      );
    } catch (error) {
      throw new Error(`Failed to resolve .gitignore conflicts: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  export { resolveCommonConflicts };