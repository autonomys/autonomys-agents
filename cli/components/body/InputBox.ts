import blessed from 'blessed';

export const createInputBox = () => {
  return blessed.textarea({
    top: '25%',
    left: 0,
    width: '100%',
    height: '55%',
    label: 'Input (Enter: send, Ctrl+N: new line, Ctrl+K: focus)',
    border: { type: 'line' },
    style: {
      border: { fg: 'yellow' },
      focus: { border: { fg: 'white' } },
    },
    margin: {
      bottom: 1,
    },
    keys: true,
    vi: true,
    mouse: true,
    input: true,
    keyable: true,
    clickable: true,
    padding: {
      left: 1,
      right: 1,
    },
  });
};
