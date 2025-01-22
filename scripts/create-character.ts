import fs from 'fs/promises';
import path from 'path';

async function createCharacter(): Promise<void> {
  // Get character name from command line arguments
  const characterName = process.argv[2];

  if (!characterName) {
    console.error('Please provide a character name');
    console.error('Usage: yarn create-character your_character_name');
    process.exit(1);
  }

  const targetDir = path.join('characters', characterName, 'config');

  try {
    // Check if target directory already exists
    try {
      await fs.access(targetDir);
      console.error(`Error: Directory ${targetDir} already exists`);
      process.exit(1);
    } catch {
      // Directory doesn't exist, which is what we want
    }

    // Copy the example directory
    console.log(`Copying character.example to ${characterName}...`);
    await fs.cp(path.join('characters', 'character.example', 'config'), targetDir, {
      recursive: true,
    });

    // Rename the files
    console.log('Renaming configuration files...');
    await fs.rename(path.join(targetDir, '.env.example'), path.join(targetDir, '.env'));
    await fs.rename(
      path.join(targetDir, 'character.example.yaml'),
      path.join(targetDir, `${characterName}.yaml`),
    );
    await fs.rename(
      path.join(targetDir, 'config.example.yaml'),
      path.join(targetDir, 'config.yaml'),
    );

    console.log(`Setup complete! Your new character directory '${characterName}' is ready.`);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

createCharacter();
