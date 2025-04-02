import { join } from "path";

import { dirname } from "path";
import { fileURLToPath } from "url";

// Get the absolute path to the project root
export const getProjectRoot = () => {
  // For ESM, we need to get the directory name from the file URL
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Go up from src/config to the project root
  return join(__dirname, '..', '..', '..');
};
