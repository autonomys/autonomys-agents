import blessed from 'blessed';

export const createOutputLog = () => {
  return blessed.log({
    top: 8,
    left: '0%',
    width: '100%',
    height: '40%',
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
    vi: false,
    mouse: true,
    tags: true,
    scrollback: 5000,
    bufferLength: 300,
  });
};
