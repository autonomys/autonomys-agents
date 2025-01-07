import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../../../../utils/logger.js';
import { uploadCharacterToDsn } from '../../../tools/utils/dsnUpload.js';
import { downloadCharacter as downloadCharacterFromDsn } from '../../../tools/utils/dsnDownload.js';

const logger = createLogger('character-manager');

const CHARACTERS_DIR = join(process.cwd(), 'src/agents/workflows/kol/characters');

async function uploadCharacter(name: string) {
  try {
    const fullPath = join(CHARACTERS_DIR, `${name}.ts`);
    if (!existsSync(fullPath)) {
      throw new Error(`Character file not found: ${fullPath}`);
    }

    const fileContent = readFileSync(fullPath, 'utf-8');
    const { character } = await import(`file://${fullPath}`);

    const result = await uploadCharacterToDsn(name, {
      content: fileContent,
      metadata: character,
    });

    logger.info('Character uploaded successfully', {
      name,
      cid: result.cid,
    });

    return result.cid;
  } catch (error) {
    logger.error('Error uploading character:', error);
    throw error;
  }
}

async function downloadCharacter(cid: string, characterName: string) {
  try {
    if (!existsSync(CHARACTERS_DIR)) {
      mkdirSync(CHARACTERS_DIR, { recursive: true });
    }

    const characterData = await downloadCharacterFromDsn(cid);
    const metadata = characterData.metadata;

    const formatValue = (value: string) => {
      if (typeof value !== 'string') return JSON.stringify(value);
      return `\`\n${value.trim()}\``;
    };

    const constDeclarations = Object.entries(metadata)
      .map(([key, value]) => `const ${key} = ${formatValue(value as string)};`)
      .join('\n\n');

    const fileContent = `// Generated from DSN CID: ${cid}
${constDeclarations}

export const character = {
${Object.keys(metadata)
  .map(key => `  ${key},`)
  .join('\n')}
};
`;

    const tsPath = join(CHARACTERS_DIR, `${characterName}.ts`);
    const jsPath = join(CHARACTERS_DIR, `${characterName}.js`);

    writeFileSync(tsPath, fileContent, 'utf-8');
    writeFileSync(jsPath, fileContent, 'utf-8');

    logger.info('Character downloaded successfully', {
      name: characterName,
      cid,
      paths: [tsPath, jsPath],
    });

    return { tsPath, jsPath };
  } catch (error) {
    logger.error('Error downloading character:', error);
    throw error;
  }
}

async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  if (!command || !arg) {
    console.error(
      'Usage: \n  yarn character upload <name>\n  yarn character download <cid> <name>',
    );
    process.exit(1);
  }

  try {
    switch (command) {
      case 'upload':
        await uploadCharacter(arg);
        break;
      case 'download':
        const name = process.argv[4];
        if (!name) {
          throw new Error('Download requires both CID and character name');
        }
        await downloadCharacter(arg, name);
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    logger.error('Command failed:', error);
    process.exit(1);
  }
}

main();
