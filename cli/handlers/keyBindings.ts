import { spawn } from 'child_process';
import { UIComponents, AppState } from '../types/types.js';

export const setupKeyBindings = (ui: UIComponents, state: AppState) => {
  const { screen, outputLog, inputBox, statusBox } = ui;

  // Quit bindings
  screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

  // Input focus binding
  screen.key('f2', () => {
    inputBox.focus();
    screen.render();
  });

  // Scroll bindings
  screen.key(['pageup'], () => {
    outputLog.scroll(-Number(outputLog.height));
    screen.render();
  });

  screen.key(['pagedown'], () => {
    outputLog.scroll(Number(outputLog.height));
    screen.render();
  });

  screen.key(['up'], () => {
    outputLog.scroll(-1);
    screen.render();
  });

  screen.key(['down'], () => {
    outputLog.scroll(1);
    screen.render();
  });
};
