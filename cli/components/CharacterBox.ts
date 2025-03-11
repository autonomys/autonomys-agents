import blessed from 'blessed';
import { loadCharacter } from '../../src/config/characters.js';

export const createCharacterBox = (characterDirName: string) => {
  let displayName = characterDirName;
  try {
    const character = loadCharacter(characterDirName);
    displayName = character.name;
  } catch (error) {
    console.error('Failed to load character name:', error);
  }

  return blessed.box({
    top: 0,
    left: 0,
    width: '20%',
    height: 5,
    label: ' Character ',
    content: `${displayName}`,
    padding: {
      top: 0,
      right: 1,
      bottom: 0,
      left: 1,
    },
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      fg: 'white',
      bg: 'red',
      bold: true,
    },
    align: 'center',
    valign: 'middle',
    tags: true,
  });
};
