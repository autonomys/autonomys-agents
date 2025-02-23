import blessed from 'blessed';

export const createConfirmDialog = () => {
  const dialog = blessed.question({
    border: 'line',
    height: '8%',
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
        fg: 'red',
      },
    },
    padding: {
      left: 1,
      right: 1,
    },
    hidden: true,
    wrap: false,
  });

  // Override the buttons rendering
  dialog._.okay.hide();
  dialog._.cancel.hide();

  return dialog;
};
