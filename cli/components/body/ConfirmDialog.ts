import blessed from 'blessed';

export const createConfirmDialog = () => {
  return blessed.question({
    border: 'line',
    height: 3,
    width: '100%',
    bottom: 0,
    left: 0,
    label: ' Confirm Delete ',
    tags: true,
    keys: true,
    vi: false,
    mouse: true,
    style: {
      fg: 'white',
      bg: 'red',
      border: {
        fg: 'red'
      }
    },
    padding: {
      left: 1,
      right: 1
    },
    hidden: true
  });
}; 