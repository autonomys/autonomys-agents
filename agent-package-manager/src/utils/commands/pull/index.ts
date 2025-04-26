import ora from 'ora';
import { runCommandWithOutput, runCommand } from './commands.js';
import { resolveCommonConflicts } from './resolver.js';
import { extractUserCustomizations, isGitInstalled } from './utils.js';
import { initializeGitIfNeeded, setupTemplateRemote, commitCurrentChanges } from './git.js';

/**
 * Update template from remote with smart conflict resolution
 */
const updateTemplate = async (
  projectPath: string, 
  spinner: ReturnType<typeof ora>,
  force = false
): Promise<{ hasChanges: boolean; conflicts: boolean; remainingConflicts?: string[] }> => {
  try {
    // Check if Git is installed
    if (!await isGitInstalled()) {
      throw new Error('Git is not installed. Please install Git to use the update feature.');
    }
    
    // Initialize Git if needed
    const _gitInitialized = await initializeGitIfNeeded(projectPath, spinner);
    
    // Setup template remote
    const _templateRemoteSetup = await setupTemplateRemote(projectPath, spinner);
    
    // Extract user customizations before update
    spinner.text = 'Extracting project customizations...';
    const userCustomizations = await extractUserCustomizations(projectPath);
    
    // Commit current changes if any
    const hadUncommittedChanges = await commitCurrentChanges(projectPath, spinner);
    
    // Fetch latest template changes
    spinner.text = 'Fetching latest template changes...';
    const _templateFetch = await runCommand('git fetch template main', projectPath, spinner);
    
    // Check if there are any changes to merge
    const { stdout: diffStatus } = await runCommandWithOutput(
      'git diff HEAD..template/main --name-only', 
      projectPath
    );
    
    if (diffStatus.trim() === '') {
      return { hasChanges: false, conflicts: false };
    }
    
    // Create a backup branch if we're about to merge changes
    const backupBranchName = `template-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const _backupBranch = await runCommand(`git branch ${backupBranchName}`, projectPath, spinner);
    spinner.text = `Created backup branch: ${backupBranchName}`;
    
    // Temporary stash any pending changes
    const _stash = await runCommand('git stash -u', projectPath, spinner);
    
    // Merge template changes - allow conflicts
    spinner.text = 'Merging template changes...';
    
    try {
      const _merge = await runCommand(
        'git merge template/main --allow-unrelated-histories', 
        projectPath, 
        spinner
      );
      
      // Successfully merged without conflicts
      
      // Pop stashed changes if there were any
      if (hadUncommittedChanges) {
        try {
          const _stashPop = await runCommand('git stash pop', projectPath, spinner);
        } catch (stashError) {
          spinner.warn('Stashed changes could not be reapplied due to conflicts.');
          spinner.text = 'Please resolve stash conflicts manually.';
        }
      }
      
      return { hasChanges: true, conflicts: false };
    } catch (mergeError) {
      // Expected conflicts in common files
      spinner.text = 'Smart conflict resolution in progress...';
      
      try {
        // Automatically resolve common conflicts
        const { fullyResolved, remainingConflicts } = await resolveCommonConflicts(projectPath, userCustomizations, spinner);
        
        // Pop stashed changes if there were any
        if (hadUncommittedChanges) {
          try {
            const _stashPop = await runCommand('git stash pop', projectPath, spinner);
          } catch (stashError) {
            spinner.warn('Stashed changes could not be reapplied due to conflicts.');
            spinner.text = 'Please resolve stash conflicts manually.';
          }
        }
        
        return { 
          hasChanges: true, 
          conflicts: !fullyResolved,
          remainingConflicts: remainingConflicts 
        };
      } catch (resolutionError) {
        // If smart conflict resolution fails, either abort or continue based on force flag
        if (force) {
          // Get the list of conflicting files
          const { stdout: conflictingFiles } = await runCommandWithOutput(
            'git diff --name-only --diff-filter=U',
            projectPath
          );
          const conflictingFilesArray = conflictingFiles.split('\n').filter(Boolean);
          
          spinner.warn('Automatic conflict resolution failed. Manual resolution required.');
          return { 
            hasChanges: true, 
            conflicts: true,
            remainingConflicts: conflictingFilesArray
          };
        } else {
          // Abort the merge
          const _mergeAbort = await runCommand('git merge --abort', projectPath, spinner);
          
          // Pop stashed changes if there were any
          if (hadUncommittedChanges) {
            const _stashPop = await runCommand('git stash pop', projectPath, spinner);
          }
          
          throw new Error(
            'Template update failed. Automatic conflict resolution was unsuccessful. Run with --force to proceed with manual conflict resolution.'
          );
        }
      }
    }
  } catch (error) {
    throw new Error(`Failed to update template: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export { updateTemplate }; 