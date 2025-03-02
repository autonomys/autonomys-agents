import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import extract from 'extract-zip';
import { CommandResult } from '../types/index.js';
import { getToolFromRegistry, getToolVersionFromRegistry } from '../utils/registry.js';
import { downloadFileFromDsn } from '../utils/autoDriveClient.js';

const PACKAGES_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', '.autoOS', 'packages');
const TOOLS_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', '.autoOS', 'tools');

const DEFAULT_PROJECT_TOOLS_PATH = 'src/agents/tools';

/**
 * Detects the root directory of the current project
 * @returns Path to the project root or undefined if not found
 */
async function detectProjectRoot(): Promise<string | undefined> {
  let currentDir = process.cwd();
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  
  while (currentDir && currentDir !== homeDir && currentDir !== path.parse(currentDir).root) {
    try {
      const files = await fs.readdir(currentDir);
      if (
        files.includes('package.json') || 
        files.includes('tsconfig.json') ||
        files.includes('.git')
      ) {
        return currentDir;
      }
      
      currentDir = path.dirname(currentDir);
    } catch (error) {
      // If we can't read the directory, move up
      currentDir = path.dirname(currentDir);
    }
  }
  
  return undefined;
}

/**
 * Downloads and extracts a tool package from Autonomys DSN
 * @param cid Content identifier for the tool package
 * @returns Path to the extracted package
 */
async function downloadToolPackage(cid: string): Promise<string> {
  await fs.mkdir(PACKAGES_DIR, { recursive: true });
  
  const packagePath = path.join(PACKAGES_DIR, `${cid}.zip`);
  
  try {
    // Download the file
    console.log(`Downloading tool package with CID: ${cid}`);
    const fileStream = await downloadFileFromDsn(cid, process.env.AUTO_DRIVE_ENCRYPTION_PASSWORD);
    
    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }
    
    const fileData = Buffer.concat(chunks);
    await fs.writeFile(packagePath, fileData);
    
    console.log(`Tool package downloaded to: ${packagePath}`);
    return packagePath;
  } catch (error) {
    console.error('Error downloading package:', error);
    throw error;
  }
}

/**
 * Extracts a tool package to the destination directory
 * @param packagePath Path to the downloaded package
 * @param toolName Name of the tool
 * @param destDir Destination directory for extraction
 * @returns Path to the extracted tool directory
 */
async function extractToolPackage(packagePath: string, toolName: string, destDir: string): Promise<string> {
  const toolDir = path.join(destDir, toolName);
  await fs.mkdir(toolDir, { recursive: true });
  
  try {
    console.log(`Extracting package to: ${toolDir}`);
    await extract(packagePath, { dir: toolDir });
    
    return toolDir;
  } catch (error) {
    console.error('Error extracting package:', error);
    throw error;
  }
}

/**
 * Determines the appropriate tools directory in the project
 * @param projectRoot The root directory of the project
 * @returns Path to the tools directory
 */
async function getProjectToolsDir(projectRoot: string): Promise<string> {
  const possiblePaths = [
    'src/agents/tools',
  ];
  
  for (const relativePath of possiblePaths) {
    const fullPath = path.join(projectRoot, relativePath);
    try {
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        return fullPath;
      }
    } catch (error) {
    }
  }
  
  const toolsDir = path.join(projectRoot, DEFAULT_PROJECT_TOOLS_PATH);
  await fs.mkdir(toolsDir, { recursive: true });
  return toolsDir;
}

/**
 * Downloads and installs a tool from Autonomys DSN
 * @param toolInfo Information about the tool
 * @param options Installation options
 */
async function downloadAndInstallTool(
  toolInfo: { name: string, cid: string },
  options: { local?: boolean } = {}
): Promise<void> {
  try {
    const packagePath = await downloadToolPackage(toolInfo.cid);
    
    let installDir: string;
    let installType: 'global' | 'local' = 'global';
    
    if (options.local) {
      const projectRoot = await detectProjectRoot();
      if (!projectRoot) {
        throw new Error('Could not detect project root. Make sure you are in a project directory.');
      }
      
      installDir = await getProjectToolsDir(projectRoot);
      installType = 'local';
    } else {
      installDir = TOOLS_DIR;
    }
    
    const toolDir = await extractToolPackage(packagePath, toolInfo.name, installDir);
    
    console.log(`Tool installed successfully to: ${toolDir}`);
    
    if (installType === 'local') {
      // TODO: Update project manifest or package.json with the new tool dependency
    }
    
    return;
  } catch (error) {
    console.error('Failed to download and install tool:', error);
    throw error;
  }
}

export async function install(toolName: string, options: any): Promise<CommandResult> {
  const spinner = ora(`Installing ${toolName}...`).start();
  const installType = options.local ? 'locally' : 'globally';
  let versionText = '';
  
  try {
    let toolInfo;
    
    if (options.cid) {
      toolInfo = {
        name: toolName,
        cid: options.cid
      };
      spinner.text = `Installing ${toolName} ${installType} using CID: ${options.cid}`;
    } 
    // Registry lookup path
    else {
      // Look up tool in registry
      if (options.version) {
        // If a specific version is requested
        versionText = `version ${options.version}`;
        spinner.text = `Looking for ${toolName} ${versionText}...`;
        toolInfo = await getToolVersionFromRegistry(toolName, options.version);
        
        if (!toolInfo) {
          spinner.fail(`${versionText} of tool '${toolName}' not found in registry`);
          return { 
            success: false, 
            message: `${versionText} of tool '${toolName}' not found in registry. Use 'autoOS list -d' to see available versions.` 
          };
        }
        
        spinner.text = `Installing ${toolName} ${versionText} ${installType} from registry...`;
      } else {
        // Get the latest version
        toolInfo = await getToolFromRegistry(toolName);
        
        if (!toolInfo) {
          spinner.fail(`Tool '${toolName}' not found in registry`);
          return { success: false, message: `Tool '${toolName}' not found in registry` };
        }
        
        versionText = `(latest: ${toolInfo.version})`;
        spinner.text = `Installing ${toolName} ${versionText} ${installType} from registry...`;
      }
    }
    
    // Download and install the tool
    await downloadAndInstallTool(toolInfo, { local: options.local });
    
    spinner.succeed(`Successfully installed ${toolName} ${versionText} ${installType}`);
    
    // Provide import info
    let importPath = '';
    if (options.local) {
      // For local installation, import path is relative to the project
      const projectRoot = await detectProjectRoot();
      if (projectRoot) {
        const toolsDir = await getProjectToolsDir(projectRoot);
        const relPath = path.relative(projectRoot, path.join(toolsDir, toolName)).replace(/\\/g, '/');
        importPath = `./${relPath}`;
      }
    } else {
      // For global installation, import path requires special handling
      importPath = `~/.autoOS/tools/${toolName}`;
    }
    
    console.log(chalk.green(`\nYou can now import the tool with:`));
    
    // Format the tool name to proper camelCase for the import
    const formattedToolName = toolName.replace(/-([a-z])/g, g => g[1].toUpperCase());
    // Get the capitalized first letter
    const capitalizedToolName = formattedToolName.charAt(0).toUpperCase() + formattedToolName.slice(1);
    
    console.log(`import { create${capitalizedToolName}Tool } from '${importPath}'`);
    
    if (!options.local) {
      console.log(chalk.yellow(`\nTip: To install tools directly to your project, use the --local flag:`));
      console.log(`autoOS install ${toolName} --local`);
    }
    
    return { 
      success: true, 
      message: `Successfully installed ${toolName} ${versionText} ${installType}` 
    };
  } catch (error) {
    spinner.fail(`Failed to install ${toolName} ${versionText}`);
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    return { 
      success: false, 
      message: `Failed to install ${toolName} ${versionText}: ${error}` 
    };
  }
} 