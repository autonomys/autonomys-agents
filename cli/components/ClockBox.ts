import blessed from 'blessed';

export const createClockBox = () => {
  return blessed.box({
    top: 0,
    right: 0,
    width: '20%',
    height: 5,
    label: ' Date & Time ',
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
