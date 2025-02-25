import blessed from 'blessed';

export const createInputBox = () => {
  return blessed.textarea({
    top: 3, // Start right after status box
    left: 0,
    width: '100%',
    height: '100%-3', // Leave space just for status box
    label: 'Input (Enter: send, Ctrl+N: new line, Ctrl+K: focus)',
    border: { type: 'line' },
    style: {
      border: { fg: 'yellow' },
      focus: { border: { fg: 'white' } },      
    },
    keys: true,
    vi: true,
    mouse: true,
    inputOnFocus: false,
    input: true,
    keyable: true,
    clickable: true,
    padding: {
      left: 1,
      right: 1,
      top: 1
    },
    wrap: true,    
  });
};
