import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOOLS_DIR = path.join(__dirname, '../src/agents/tools');

async function findExampleConfigs() {
  // Find all example config files
  const exampleConfigs = await glob('**/**.config.example.yaml', {
    cwd: TOOLS_DIR,
    absolute: true,
  });

  return exampleConfigs.map(examplePath => {
    const relativePath = path.relative(TOOLS_DIR, examplePath);
    const toolDir = relativePath.split(path.sep)[0];
    const fileName = path.basename(examplePath);
    const targetFile = fileName.replace('.example.yaml', '.yaml');

    return {
      toolDir,
      examplePath,
      targetPath: path.join(path.dirname(examplePath), targetFile),
    };
  });
}

function generateConfig(toolDir: string, examplePath: string, targetPath: string) {
  // Check if target already exists
  if (fs.existsSync(targetPath)) {
    console.log(`⚠️  Config already exists: ${targetPath}`);
    return;
  }

  try {
    // Copy example to target
    fs.copyFileSync(examplePath, targetPath);
    console.log(`✅ Generated config: ${targetPath}`);
  } catch (error) {
    console.error(`❌ Error generating config for ${toolDir}:`, error);
  }
}

async function main() {
  console.log('🔧 Generating tool configurations...\n');

  const configs = await findExampleConfigs();
  
  if (configs.length === 0) {
    console.log('❌ No example configs found!');
    return;
  }

  // Create configs for each tool
  configs.forEach(({ toolDir, examplePath, targetPath }) => {
    console.log(`📁 Processing ${toolDir}...`);
    generateConfig(toolDir, examplePath, targetPath);
  });

  console.log('\n✨ Configuration generation complete!');
  console.log(`Found and processed ${configs.length} example configs.`);
  console.log('\n⚠️  Remember to update the generated config files with your actual settings!');
}

main().catch(error => {
  console.error('Failed to generate configs:', error);
  process.exit(1);
}); 