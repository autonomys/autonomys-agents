
import { PasswordCache } from '../../types/index.js';
import { PASSWORD_CACHE_TIMEOUT } from '../../config/default.js';

// Add a password cache system to avoid prompting multiple times
// This will timeout after a certain period for security
// Store password in memory only (not persisted)
let masterPasswordCache: PasswordCache | null = null;

/**
 * Store the master password in the cache
 */
export const cachePassword = (password: string): void => {
  masterPasswordCache = {
    password,
    timestamp: Date.now(),
  };
};

/**
 * Get the cached password if it exists and hasn't expired
 * @returns The cached password or null if expired or not cached
 */
export const getCachedPassword = (): string | null => {
  if (!masterPasswordCache) return null;

  const now = Date.now();
  const elapsed = now - masterPasswordCache.timestamp;

  if (elapsed > PASSWORD_CACHE_TIMEOUT) {
    // Password cache has expired
    masterPasswordCache = null;
    return null;
  }

  // Update the timestamp to extend the cache
  masterPasswordCache.timestamp = now;
  return masterPasswordCache.password;
};
