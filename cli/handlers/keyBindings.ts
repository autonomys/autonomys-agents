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

  // External terminal binding (F3)
  screen.key('f3', () => {
    if (state.value.trim().length > 0) {
      let cmd, args;
      if (process.platform === 'darwin') {
        cmd = 'osascript';
        args = [
          '-e',
          `tell app "Terminal" to do script "cd '${process.cwd()}' && npx ts-node cli/taskRunner.ts '${state.value}'"`,
        ];
      } else {
        cmd = 'x-terminal-emulator';
        args = ['-e', `cd '${process.cwd()}' && npx ts-node cli/taskRunner.ts '${state.value}'`];
      }
      spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
      statusBox.setContent('Status: Temporary terminal launched for task.');
      screen.render();
    } else {
      statusBox.setContent('Status: No current message to run.');
      screen.render();
    }
  });
};
