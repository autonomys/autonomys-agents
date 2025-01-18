import { readdir } from 'fs/promises';
import { join } from 'path';
import { loadCharacter } from '../../config/characters.js';

interface CharacterInfo {
  id: string;
  name: string;
  description: string;
  username: string;
}

export const listAvailableCharacters = async (): Promise<CharacterInfo[]> => {
  const charactersPath = join(process.cwd(), 'config', 'characters');
  const files = await readdir(charactersPath);
  const characterFiles = files.filter(file => file.endsWith('.yaml'));

  const characters = await Promise.all(
    characterFiles.map(async file => {
      const id = file.replace(/\.yaml$/, '');
      const character = loadCharacter(id);
      return {
        id,
        name: character.name,
        description: character.description,
        username: character.username,
      };
    }),
  );
  return characters;
};
