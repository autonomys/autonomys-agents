import blessed from 'blessed';
import { UIComponents } from '../types/types.js';
import { loadCharacter } from '../../src/config/characters.js';

export const createLogoBox = () => {
  const logoArt = `{cyan-fg}    _         _                                        
   / \\  _   _| |_ ___  _ __   ___  _ __ ___  _   _ ___ 
  / _ \\| | | | __/ _ \\| '_ \\ / _ \\| '_ \` _ \\| | | / __|
 / ___ \\ |_| | || (_) | | | | (_) | | | | | | |_| \\__ \\
/_/   \\_\\__,_|\\__\\___/|_| |_|\\___/|_| |_| |_|\\__, |___/
                                             |___/     {/cyan-fg}`;

  return blessed.box({
    top: 0,
    left: 'center',
    width: '60%',
    height: 10,
    content: logoArt,
    tags: true,
    align: 'center',
    valign: 'middle',
    wrap: false,
    border: 'line',
    style: {
      fg: 'cyan',
      transparent: true,
      border: { fg: 'cyan' },
    },
  });
};

export const createClockBox = () => {
  return blessed.box({
    top: 0,
    right: 0,
    width: '20%',
    height: 5,
    label: ' Date & Time ',
    content: '',
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
      bg: 'blue',
      bold: true,
    },
    align: 'center',
    valign: 'middle',
    tags: true,
  });
};

export const createOutputLog = () => {
  return blessed.log({
    top: 6, // Just below the header area
    left: '0%',
    width: '100%',
    height: '75%', // Give more space to the main content
    label: 'Workflow Output',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
    },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'blue',
      },
      style: { inverse: true },
    },
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
  });
};

export const createHeaderArea = () => {
  return blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 6,
    children: [createLogoBox(), createCharacterBox(process.argv[2] || 'Unknown'), createClockBox()],
  });
};

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

export const createBottomArea = () => {
  const container = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: '25%',
  });

  // Split into left and right sections
  const leftSection = blessed.box({
    top: 0,
    left: 0,
    width: '70%',
    height: '100%',
  });

  const rightSection = blessed.box({
    top: 0,
    right: 0,
    width: '30%',
    height: '100%',
  });

  // Create components
  const inputBox = blessed.textarea({
    bottom: 0,
    left: 0,
    width: '100%',
    height: '50%',
    label: 'Input (Enter: send, Ctrl+N: new line)',
    border: { type: 'line' },
    style: {
      border: { fg: 'yellow' },
      focus: { border: { fg: 'white' } },
    },
    keys: true,
    vi: false,
    mouse: true,
    inputOnFocus: false,
    padding: {
      left: 1,
      right: 1,
    },
  });

  const statusBox = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '50%',
    label: 'Status',
    border: { type: 'line' },
    style: {
      border: { fg: 'green' },
      fg: 'white',
    },
    padding: {
      left: 1,
      right: 1,
    },
  });

  const scheduledTasksBox = blessed.list({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    label: 'Scheduled Tasks',
    border: { type: 'line' },
    style: {
      border: { fg: 'magenta' },
      selected: { bg: 'blue' },
      item: { hover: { bg: 'blue' } },
    },
    scrollable: true,
    scrollbar: {
      ch: ' ',
      style: { inverse: true },
    },
    padding: {
      left: 1,
      right: 1,
    },
    mouse: true,
    keys: true,
    vi: true,
    items: [],
  });

  // Append components to their sections
  leftSection.append(statusBox);
  leftSection.append(inputBox);
  rightSection.append(scheduledTasksBox);

  // Append sections to container
  container.append(leftSection);
  container.append(rightSection);

  return {
    container,
    inputBox,
    statusBox,
    scheduledTasksBox,
  };
};

export const createSearchBox = () => {
  return blessed.textbox({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    border: 'line',
    style: {
      fg: 'white',
      bg: 'blue',
      border: {
        fg: 'white',
      },
    },
    hidden: true,
    mouse: true,
    inputOnFocus: true,
    padding: {
      left: 1,
      right: 1,
    },
  });
};

export const createUI = (): UIComponents => {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Autonomys CLI',
    autoPadding: true,
    warnings: true,
    fullUnicode: true,
    input: process.stdin,
    output: process.stdout,
    terminal: 'xterm-256color',
  });

  // Create main layout areas
  const headerArea = createHeaderArea();
  const outputLog = createOutputLog();
  const bottomArea = createBottomArea();
  const searchBox = createSearchBox();

  // Variable to suppress the first key in searchBox
  let suppressNextSearchKey = false;

  // When a key is pressed in the searchBox, if suppression is active, ignore it
  searchBox.on('keypress', (ch, key) => {
    if (suppressNextSearchKey) {
      suppressNextSearchKey = false;
      return false; // prevent duplicate character
    }
  });

  // Append everything in the correct order
  screen.append(headerArea);
  screen.append(outputLog);
  screen.append(bottomArea.container);
  screen.append(searchBox);

  // Handle Ctrl+F using low-level keypress event with delayed focus
  screen.program.on('keypress', (ch, key) => {
    if (key && key.ctrl && key.name === 'f') {
      bottomArea.inputBox.cancel();
      searchBox.show();
      searchBox.clearValue();
      suppressNextSearchKey = true; // suppress the key that triggered Ctrl+F
      setTimeout(() => {
        searchBox.focus();
      }, 100);
      screen.render();
      return false;
    }
  });

  // Bind 'enter' on the searchBox to emit submit event
  searchBox.key('enter', () => {
    searchBox.emit('submit');
  });

  // Bind 'escape' on the searchBox to cancel search and refocus inputBox
  searchBox.key('escape', () => {
    searchBox.hide();
    bottomArea.inputBox.focus();
    screen.render();
  });

  // Focus input box by default
  bottomArea.inputBox.focus();

  return {
    screen,
    outputLog,
    statusBox: bottomArea.statusBox,
    scheduledTasksBox: bottomArea.scheduledTasksBox,
    inputBox: bottomArea.inputBox,
    clockBox: headerArea.children[2] as blessed.Widgets.BoxElement,
    logoBox: headerArea.children[0] as blessed.Widgets.BoxElement,
    characterBox: headerArea.children[1] as blessed.Widgets.BoxElement,
    searchBox,
  };
};
