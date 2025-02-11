import blessed from 'blessed';
import { UIComponents } from '../types/types.js';

export const createOutputLog = () => {
  return blessed.log({
    top: '0%',
    left: '0%',
    width: '100%',
    height: '70%',
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
  return blessed.textbox({
    bottom: 0,
    left: '0%',
    width: '100%',
    height: '10%',
    label: 'Input - Type message and press Enter (F2 to focus)',
    border: { type: 'line' },
    style: {
      border: { fg: 'yellow' },
      focus: { border: { fg: 'white' } },
    },
    inputOnFocus: true,
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

  screen.append(outputLog);
  screen.append(statusBox);
  screen.append(scheduledTasksBox);
  screen.append(inputBox);

  return { screen, outputLog, statusBox, scheduledTasksBox, inputBox };
};
