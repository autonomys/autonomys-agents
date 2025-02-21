import blessed from 'blessed';

export const createLogoBox = () => {
  const logoArt = `{cyan-fg}    _         _                                        
   / \\  _   _| |_ ___  _ __   ___  _ __ ___  _   _ ___ 
  / _ \\| | | | __/ _ \\| '_ \\ / _ \\| '_ \` _ \\| | | / __|
 / ___ \\ |_| | || (_) | | | | (_) | | | | | | |_| \\__ \\
/_/   \\_\\__,_|\\__\\___/|_| |_|\\___/|_| |_| |_|\\__, |___/
                                             |___/     {/cyan-fg}`;

  return blessed.box({
    top: 0,
    left: 'center',
    width: '60%',
    height: 10,
    content: logoArt,
    tags: true,
    align: 'center',
    valign: 'middle',
    wrap: false,
    border: 'line',
    style: {
      fg: 'cyan',
      transparent: true,
      border: { fg: 'cyan' },
    },
  });
}; 