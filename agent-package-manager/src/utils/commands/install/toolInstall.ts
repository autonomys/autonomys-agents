import fs from 'fs/promises';
import path from 'path';
import { PACKAGES_DIR } from '../../shared/path.js';
import { downloadFileFromGateway } from '../../autoDrive/gatewayClient.js';
import { ToolInstallInfo, ToolManifest } from '../../../types/index.js';
import { loadCredentials } from '../../credential/index.js';
import { getCidFromHash } from '../../blockchain/utils.js';
import extract from "extract-zip";
import chalk from 'chalk';


const fetchToolPackage = async (cidHash: string): Promise<string> => {
  const cid = getCidFromHash(cidHash);
  const credentials = await loadCredentials();
  const packagePath = path.join(PACKAGES_DIR, `${cid}.zip`);

  try {
    console.log(`Downloading tool package with CID: ${cid}`);

    const fileStream = await downloadFileFromGateway(cid);

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
};

const unpackToolToDirectory = async (
  packagePath: string,
  toolName: string,
  targetDir: string,
): Promise<string> => {
  const toolDir = path.join(targetDir, toolName);
  await fs.mkdir(toolDir, { recursive: true });

  try {
    console.log(`Extracting package to: ${toolDir}`);
    await extract(packagePath, { dir: toolDir });
    return toolDir;
  } catch (error) {
    console.error('Error extracting package:', error);
    throw error;
  }
};    

/**
 * Checks if the tool's dependencies are in the project's package.json
 * and logs a message for any missing dependencies
 */
const checkToolDependencies = async (toolDir: string): Promise<void> => {
  try {
    // Read the tool's manifest.json
    const manifestPath = path.join(toolDir, 'manifest.json');
    const manifestData = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData) as ToolManifest;
    
    if (!manifest.dependencies || Object.keys(manifest.dependencies).length === 0) {
      return; // No dependencies to check
    }
    
    // Try to find the project's package.json by going up directories
    let currentDir = path.resolve(toolDir, '..');
    let projectPackageJson = null;
    
    // Look for package.json in parent directories to find project root
    while (currentDir !== path.parse(currentDir).root) {
      try {
        const packageJsonPath = path.join(currentDir, 'package.json');
        const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
        projectPackageJson = JSON.parse(packageJsonData);
        break;
      } catch (error) {
        currentDir = path.resolve(currentDir, '..');
      }
    }
    
    if (!projectPackageJson) {
      console.warn(chalk.yellow(`Warning: Could not find project's package.json to check dependencies`));
      return;
    }
    
    // Check if each dependency is in the project's package.json
    const missingDependencies: string[] = [];
    
    for (const [dependency, version] of Object.entries(manifest.dependencies)) {
      if (!projectPackageJson.dependencies || !projectPackageJson.dependencies[dependency]) {
        missingDependencies.push(`${dependency}@${version}`);
      }
    }
    
    if (missingDependencies.length > 0) {
      console.warn(chalk.yellow('Warning: The following dependencies required by the tool are not in your package.json:'));
      console.warn(chalk.yellow(missingDependencies.join(', ')));
      console.warn(chalk.yellow('Please add these dependencies to your project to ensure the tool works correctly.'));
    }
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Could not check tool dependencies: ${error instanceof Error ? error.message : String(error)}`));
  }
};

const performToolInstallation = async (
  toolInfo: ToolInstallInfo,
  toolInstallDir: string,
): Promise<string> => {
  try {
    const packagePath = await fetchToolPackage(toolInfo.cid);
    const toolDir = await unpackToolToDirectory(packagePath, toolInfo.name, toolInstallDir);
    
    // Check if the tool has dependencies not in the project
    await checkToolDependencies(toolDir);
    
    console.log(`Tool installed successfully to: ${toolDir}`);
    return toolDir;
  } catch (error) {
    console.error('Failed to install tool:', error);
    throw error;
  }
};

export {
  fetchToolPackage,
  unpackToolToDirectory,
  performToolInstallation,
  checkToolDependencies,
};
