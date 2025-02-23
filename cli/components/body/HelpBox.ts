import blessed from 'blessed';

export const createHelpBox = () => {
  const shortcuts = [
    // '{white-fg}Ctrl+F{/white-fg}: Search',
    // '{white-fg}ESC{/white-fg}: Exit search',
    '{white-fg}Ctrl+N{/white-fg}: New line',
    '{white-fg}Ctrl+K{/white-fg}: Focus input',
    '{white-fg}Ctrl+T{/white-fg}: View tasks',
    '{white-fg}Ctrl+C{/white-fg}: Exit',
    '{white-fg}↓{/white-fg}: Next match',
    '{white-fg}↑{/white-fg}: Previous match',
  ].join(' {gray-fg}|{/gray-fg} ');

  const box = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: '8%',
    border: {
      type: 'line',
      fg: 240,
    },
    style: {
      fg: 'gray',
      bg: 'black',
    },
    padding: {
      top: 0,
      left: 1,
      right: 1,
      bottom: 0,
    },
    tags: true,
    label: ' Keyboard Shortcuts ',
    align: 'center',
    valign: 'middle',
  });

  box.setContent(shortcuts);
  return box;
};
