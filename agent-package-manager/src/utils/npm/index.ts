import axios from 'axios';

interface NpmPackageInfo {
  name: string;
  version: string;
  description: string;
  homepage: string;
  license: string;
  [key: string]: any;
}

/**
 * Fetches package information from npm registry
 * @param packageName The npm package name
 * @returns Package information
 */
export const getNpmPackageInfo = async (packageName: string): Promise<NpmPackageInfo> => {
  try {
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch package info: ${response.statusText}`);
    }
    
    const data = response.data;
    const latestVersion = data['dist-tags']?.latest;
    
    if (!latestVersion) {
      throw new Error('Could not determine latest version');
    }
    
    const versionInfo = data.versions[latestVersion];
    
    return {
      name: data.name,
      version: latestVersion,
      description: versionInfo.description || data.description || '',
      homepage: versionInfo.homepage || data.homepage || '',
      license: versionInfo.license || data.license || '',
      ...versionInfo
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch package info: ${error.message}`);
    }
    throw error;
  }
}; 