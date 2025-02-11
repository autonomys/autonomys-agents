import { spawn } from 'child_process';
import { UIComponents, AppState } from '../types/types.js';

export const setupKeyBindings = (ui: UIComponents, state: AppState) => {
  const { screen, outputLog, inputBox, statusBox } = ui;

  // Quit bindings
  screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

  // Input focus binding
  screen.key(['C-i'], () => {
    inputBox.focus();
    screen.render();
  });

  // Scroll bindings
  screen.key(['C-b'], () => {
    outputLog.scroll(-Number(outputLog.height));
    screen.render();
  });

  screen.key(['C-f'], () => {
    outputLog.scroll(Number(outputLog.height));
    screen.render();
  });

  screen.key(['C-p'], () => {
    outputLog.scroll(-1);
    screen.render();
  });

  screen.key(['C-n'], () => {
    outputLog.scroll(1);
    screen.render();
  });
};
