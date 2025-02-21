import blessed from 'blessed';
import { UIComponents } from '../types/types.js';
import { createHeaderArea } from './HeaderArea.js';
import { createOutputLog } from './OutputLog.js';
import { createBottomArea } from './body/index.js';
import { createSearchBox } from './SearchBox.js';
import { createHelpBox } from './body/HelpBox.js';

// Add screen type definition
interface ExtendedScreen extends blessed.Widgets.Screen {
  render(): void;
}

export const createUI = (): UIComponents => {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Autonomys CLI',
    autoPadding: true,
    warnings: false,
    fullUnicode: true,
    input: process.stdin,
    output: process.stdout,
    terminal: process.env.TERM || 'xterm-256color',
    useBCE: true,
    dockBorders: true,
  }) as ExtendedScreen;

  // Add proper exit handling
  screen.key(['C-c', 'q'], () => {
    // Clear all intervals and timeouts
    screen.clearRegion(0, screen.width as number, 0, screen.height as number);

    // Reset cursor
    screen.program.showCursor();
    screen.program.normalBuffer();
    screen.program.reset();

    // Exit gracefully
    process.exit(0);
  });

  // Handle process exit
  process.on('exit', () => {
    screen.program.clear();
    screen.program.reset();
    screen.program.showCursor();
    screen.program.normalBuffer();
  });

  // Handle unexpected errors
  process.on('uncaughtException', err => {
    screen.program.clear();
    screen.program.reset();
    screen.program.showCursor();
    screen.program.normalBuffer();
    console.error('An error occurred:', err);
    process.exit(1);
  });

  // Create main layout areas
  const headerArea = createHeaderArea();
  const outputLog = createOutputLog();
  const bottomArea = createBottomArea();
  const searchBox = createSearchBox();
  const helpBox = createHelpBox();

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
  screen.append(bottomArea.confirmDialog);
  screen.append(helpBox);

  // Handle dialog events
  bottomArea.confirmDialog.on('action', () => {
    helpBox.show();
    screen.render();
  });

  bottomArea.confirmDialog.on('show', () => {
    helpBox.hide();
    screen.render();
  });

  bottomArea.confirmDialog.on('cancel', () => {
    helpBox.show();
    screen.render();
  });

  // Handle keyboard shortcuts
  screen.program.on('keypress', (ch, key) => {
    if (key && key.ctrl && key.name === 'f') {
      bottomArea.inputBox.cancel();
      helpBox.hide();
      searchBox.show();
      searchBox.clearValue();
      suppressNextSearchKey = true;
      setTimeout(() => {
        searchBox.focus();
      }, 100);
      screen.render();
      return false;
    }
    // Add shortcut to focus input box (Ctrl+K)
    if (key && key.ctrl && key.name === 'k') {
      searchBox.hide();
      helpBox.show();
      bottomArea.inputBox.cancel();
      setTimeout(() => {
        bottomArea.inputBox.focus();
        bottomArea.inputBox.readInput();
        screen.render();
      }, 100);
      screen.render();
      return false;
    }
    // Add shortcut to focus scheduled tasks box (Ctrl+T)
    if (key && key.ctrl && key.name === 't') {
      searchBox.hide();
      helpBox.show();
      bottomArea.inputBox.cancel();
      setTimeout(() => {
        bottomArea.scheduledTasksBox.focus();
        screen.render();
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
    helpBox.show();
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
    helpBox,
  };
};
