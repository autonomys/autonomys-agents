import blessed from 'blessed';
import { UIComponents } from '../types/types.js';

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
    height: 7,
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
    height: 3,
    label: ' Time ',
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
    top: 7,
    left: '0%',
    width: '100%',
    height: '63%',
    label: 'Workflow Output (F2 to focus input)',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      scrollbar: { bg: 'blue' },
    },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      style: { inverse: true },
    },
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
  });
};

export const createStatusBox = () => {
  return blessed.box({
    top: '70%',
    left: '0%',
    width: '100%',
    height: '10%',
    label: 'Status',
    content: 'Enter a message in the input below.',
    border: { type: 'line' },
    style: { border: { fg: 'green' } },
    mouse: true,
  });
};

export const createScheduledTasksBox = () => {
  return blessed.list({
    top: '80%',
    left: '0%',
    width: '100%',
    height: '10%',
    label: 'Scheduled Tasks',
    border: { type: 'line' },
    style: {
      border: { fg: 'magenta' },
      selected: { bg: 'blue' },
      item: { hover: { bg: 'blue' } },
    },
    mouse: true,
    keys: true,
    vi: true,
    items: [],
    scrollable: true,
    scrollbar: {
      ch: ' ',
      style: { inverse: true },
    },
  });
};

export const createInputBox = () => {
  return blessed.textarea({
    bottom: 0,
    left: '0%',
    width: '100%',
    height: '10%',
    label: 'Input - Type message (Ctrl+Enter to send, F2 to focus)',
    border: { type: 'line' },
    style: {
      border: { fg: 'yellow' },
      focus: { border: { fg: 'white' } },
    },
    keys: true,
    vi: true,
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
    title: 'Interactive CLI',
    autoPadding: true,
    warnings: true,
  });

  const outputLog = createOutputLog();
  const statusBox = createStatusBox();
  const scheduledTasksBox = createScheduledTasksBox();
  const inputBox = createInputBox();
  const clockBox = createClockBox();
  const logoBox = createLogoBox();

  screen.append(logoBox);
  screen.append(outputLog);
  screen.append(statusBox);
  screen.append(scheduledTasksBox);
  screen.append(inputBox);
  screen.append(clockBox);

  return { screen, outputLog, statusBox, scheduledTasksBox, inputBox, clockBox, logoBox };
};
