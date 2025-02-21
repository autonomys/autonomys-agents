import blessed from 'blessed';
import { createLogoBox } from './LogoBox.js';
import { createCharacterBox } from './CharacterBox.js';
import { createClockBox } from './ClockBox.js';

export const createHeaderArea = () => {
  return blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 6,
    children: [createLogoBox(), createCharacterBox(process.argv[2] || 'Unknown'), createClockBox()],
  });
};
