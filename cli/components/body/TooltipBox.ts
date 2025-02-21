import blessed from 'blessed';

export const createTooltipBox = () => {
  return blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 'shrink',
    content: '',
    tags: true,
    border: 'line',
    style: {
      border: { fg: 'yellow' },
      fg: 'white',
      bg: 'black',
    },
    padding: {
      left: 1,
      right: 1,
    },
    hidden: true,
  });
};
