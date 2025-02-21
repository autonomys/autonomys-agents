import blessed from 'blessed';

export const createStatusBox = () => {
  return blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3, // Fixed height in lines
    label: 'Status',
    border: { type: 'line' },
    style: {
      border: { fg: 'green' },
      fg: 'white',
    },
    padding: {
      left: 1,
      right: 1,
    },
    margin: {
      bottom: 1,
    },
  });
};
