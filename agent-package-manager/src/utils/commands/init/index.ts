import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import extract from "extract-zip";
import axios from 'axios';



// Add a function to run a command and log the output
const runCommand = async (
    command: string,
    cwd: string,
    _spinner: ReturnType<typeof ora>,
): Promise<void> => {
    const { exec } = await import('child_process');

    return new Promise((resolve, reject) => {
        const childProcess = exec(command, { cwd }, (error, _stdout, _stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });

        // Stream output to console
        childProcess.stdout?.pipe(process.stdout);
        childProcess.stderr?.pipe(process.stderr);
    });
};


/**
 * Download file from URL to specified path
 */
const downloadFile = async (url: string, destinationPath: string): Promise<void> => {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            maxRedirects: 5,
        });

        const writer = createWriteStream(destinationPath);

        await pipeline(response.data, writer);
    } catch (error) {
        await fs.unlink(destinationPath).catch(() => { });

        if (axios.isAxiosError(error)) {
            if (error.response) {
                throw new Error(`Failed to download: ${error.response.status} ${error.response.statusText}`);
            } else if (error.request) {
                throw new Error(`Request failed: ${error.message}`);
            }
        }

        throw error;
    }
};

/**
 * Update template files with custom project name
 */
const customizeTemplate = async (
    projectPath: string,
    packageName: string,
    spinner: ReturnType<typeof ora>,
): Promise<void> => {
    try {
        spinner.text = 'Customizing template for your project...';

        // Update package.json
        const packageJsonPath = path.join(projectPath, 'package.json');
        let packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');

        // Parse and update package.json
        const packageJson = JSON.parse(packageJsonContent);
        packageJson.name = packageName;
        const description = `${packageName} agent project`;
        packageJson.description = description;

        // Write updated package.json
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

        // Update README.md
        const readmePath = path.join(projectPath, 'README.md');
        let readmeContent = await fs.readFile(readmePath, 'utf8');

        // Replace the first h1 heading with the project name
        readmeContent = readmeContent.replace(/^# .*$/m, `# ${packageName}`);

        // Add description
        readmeContent = readmeContent.replace(/^# .*$/m, `# ${packageName}\n\n${description}`);

        await fs.writeFile(readmePath, readmeContent);
    } catch (error) {
        throw new Error(
            `Failed to customize template: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
};



/**
 * Download and extract the template repository
 */
const downloadTemplate = async (
    projectPath: string,
    spinner: ReturnType<typeof ora>,
): Promise<void> => {
    spinner.text = 'Downloading template repository...';

    try {
        // Create temporary directory for the zip file
        const tempDir = path.join(os.tmpdir(), `autonomys-template-${Date.now()}`);
        await fs.mkdir(tempDir, { recursive: true });
        const tempZipPath = path.join(tempDir, 'template.zip');

        // Download the zip file
        spinner.text = 'Downloading template from GitHub...';
        const templateUrl =
            'https://github.com/autonomys/autonomys-agent-template/archive/refs/heads/main.zip';
        await downloadFile(templateUrl, tempZipPath);

        // Extract the zip file
        spinner.text = 'Extracting template...';
        const extractDir = path.join(tempDir, 'extracted');
        await fs.mkdir(extractDir, { recursive: true });
        await extract(tempZipPath, { dir: extractDir });

        // Find the extracted directory name (should be autonomys-agent-template-main)
        const extractedItems = await fs.readdir(extractDir);
        const templateDirName = extractedItems.find(item =>
            item.startsWith('autonomys-agent-template'),
        );

        if (!templateDirName) {
            throw new Error('Could not find extracted template directory');
        }

        // Copy files from the extracted directory to the project path
        spinner.text = 'Copying template files...';
        const templateDir = path.join(extractDir, templateDirName);

        // Copy recursively
        const copyRecursive = async (src: string, dest: string) => {
            const entries = await fs.readdir(src, { withFileTypes: true });

            await fs.mkdir(dest, { recursive: true });

            for (const entry of entries) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);

                if (entry.isDirectory()) {
                    await copyRecursive(srcPath, destPath);
                } else {
                    await fs.copyFile(srcPath, destPath);
                }
            }
        };

        await copyRecursive(templateDir, projectPath);

        // Clean up
        spinner.text = 'Cleaning up...';
        await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
        throw new Error(
            `Failed to download template: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
};



export { customizeTemplate, downloadFile, downloadTemplate, runCommand };