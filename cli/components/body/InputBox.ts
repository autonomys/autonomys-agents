import blessed from 'blessed';

export const createInputBox = () => {
  return blessed.textarea({
    bottom: 0,
    left: 0,
    width: '100%',
    height: '70%',
    label: 'Input (Enter: send, Ctrl+N: new line, Ctrl+K: focus)',
    border: { type: 'line' },
    style: {
      border: { fg: 'yellow' },
      focus: { border: { fg: 'white' } },
    },
    keys: true,
    vi: true,
    mouse: true,
    inputOnFocus: true,
    input: true,
    keyable: true,
    clickable: true,
    padding: {
      left: 1,
      right: 1,
    },
  });
};
