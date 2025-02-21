import blessed from 'blessed';

export const createSearchBox = () => {
  return blessed.textbox({
    bottom: 0,
    left: 0,
    width: '100%',
    height: '8%',
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
