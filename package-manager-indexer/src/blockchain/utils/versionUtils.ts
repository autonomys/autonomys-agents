import { Version } from '../../models/Tool.js';

/**
 * Parse a semantic version from individual parts
 * @param major Major version
 * @param minor Minor version
 * @param patch Patch version
 * @returns A version object
 */
export const parseVersion = (major: number, minor: number, patch: number): Version => {
  return {
    major,
    minor,
    patch
  };
}; 