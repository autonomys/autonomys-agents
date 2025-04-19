import ora from "ora";
import { getToolFromRegistry, getToolVersionFromRegistry } from '../registry/toolInquiry.js';
import { ToolInstallInfo, InstallOptions } from '../../../types/index.js';

const resolveToolInfo = async (
    toolName: string,
    options: InstallOptions,
    spinner: ReturnType<typeof ora>,
): Promise<{ toolInfo: ToolInstallInfo; versionDisplay: string }> => {
    // Handle CID-based installation
    if (options.cid && options.cid !== undefined) {
        spinner.text = `Installing ${toolName} using CID: ${options.cid}`;
        return {
            toolInfo: {
                name: toolName,
                cid: options.cid,
            },
            versionDisplay: '',
        };
    }
    // Handle version-based installation
    if (options.version && options.version !== undefined) {
        const result = await resolveVersionInstallation(toolName, options.version, spinner);
        updateSpinnerWithInstallInfo(spinner, toolName, result.versionDisplay);
        return result;
    }
    // Handle latest version installation (default)
    const result = await resolveLatestInstallation(toolName, spinner);
    updateSpinnerWithInstallInfo(spinner, toolName, result.versionDisplay);
    return result;
};

const resolveLatestInstallation = async (
    toolName: string,
    spinner: ReturnType<typeof ora>,
): Promise<{ toolInfo: ToolInstallInfo; versionDisplay: string }> => {
    spinner.text = `Looking for latest version of ${toolName}...`;
    const registryToolInfo = await getToolFromRegistry(toolName);

    if (!registryToolInfo) {
        throw new Error(`Tool '${toolName}' not found in registry`);
    }

    const versionDisplay = `(latest: ${registryToolInfo.version})`;

    return {
        toolInfo: {
            name: registryToolInfo.name,
            cid: registryToolInfo.cid,
            version: registryToolInfo.version,
        },
        versionDisplay,
    };
};



const resolveVersionInstallation = async (
    toolName: string,
    version: string,
    spinner: ReturnType<typeof ora>,
): Promise<{ toolInfo: ToolInstallInfo; versionDisplay: string }> => {
    const versionDisplay = `version ${version}`;
    spinner.text = `Looking for ${toolName} ${versionDisplay}...`;

    const registryToolInfo = await getToolVersionFromRegistry(toolName, version);
    if (!registryToolInfo) {
        throw new Error(
            `${versionDisplay} of tool '${toolName}' not found in registry. Use 'autoOS list -d' to see available versions.`,
        );
    }

    return {
        toolInfo: {
            name: registryToolInfo.name,
            cid: registryToolInfo.cid,
            version: registryToolInfo.version,
        },
        versionDisplay,
    };
};



const updateSpinnerWithInstallInfo = (
    spinner: ReturnType<typeof ora>,
    toolName: string,
    versionDisplay: string,
): void => {
    spinner.text = `Installing ${toolName} ${versionDisplay} from registry...`;
};



export {
    updateSpinnerWithInstallInfo,
    resolveVersionInstallation,
    resolveLatestInstallation,
    resolveToolInfo,
};
