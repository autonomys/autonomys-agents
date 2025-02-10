import blessed from 'blessed';
import { spawn } from 'child_process';
import { orchestratorRunner } from '../src/agent.js';
import { validateLocalHash } from '../src/agents/tools/utils/localHashStorage.js';
import { HumanMessage } from '@langchain/core/messages';
import { Writable } from 'stream';

const createOutputStreams = (outputLog: blessed.Widgets.Log, screen: blessed.Widgets.Screen) => {
  const stdout = new Writable({
    write: (chunk: any, encoding: string, callback: () => void) => {
      outputLog.log(chunk.toString());
      screen.render();
      callback();
    },
  });

  const stderr = new Writable({
    write: (chunk: any, encoding: string, callback: () => void) => {
      outputLog.log(`{red-fg}${chunk.toString()}{/red-fg}`);
      screen.render();
      callback();
    },
  });

  return { stdout, stderr };
};

const setupKeyBindings = (
  screen: blessed.Widgets.Screen,
  outputLog: blessed.Widgets.Log,
  inputBox: blessed.Widgets.TextboxElement,
  statusBox: blessed.Widgets.BoxElement,
  currentMessage: { value: string },
) => {
  // Quit bindings
  screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

  // Input focus binding
  screen.key('f2', () => {
    inputBox.focus();
    screen.render();
  });

  // Scroll bindings
  screen.key(['pageup'], () => {
    outputLog.scroll(-outputLog.height);
    screen.render();
  });

  screen.key(['pagedown'], () => {
    outputLog.scroll(outputLog.height);
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
    if (currentMessage.value.trim().length > 0) {
      let cmd, args;
      if (process.platform === 'darwin') {
        cmd = 'osascript';
        args = [
          '-e',
          `tell app "Terminal" to do script "cd '${process.cwd()}' && npx ts-node cli/taskRunner.ts '${currentMessage.value}'"`,
        ];
      } else {
        cmd = 'x-terminal-emulator';
        args = [
          '-e',
          `cd '${process.cwd()}' && npx ts-node cli/taskRunner.ts '${currentMessage.value}'`,
        ];
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

const createUI = () => {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Interactive CLI',
    autoPadding: true,
    warnings: true,
  });

  const outputLog = blessed.log({
    top: '0%',
    left: '0%',
    width: '100%',
    height: '70%',
    label: 'Workflow Output (F2 to focus input)',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      scrollbar: { bg: 'blue' },
    },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: ' ', inverse: true },
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
  });

  const statusBox = blessed.box({
    top: '70%',
    left: '0%',
    width: '100%',
    height: '10%',
    label: 'Status',
    content: 'Enter a message in the input below.',
    border: { type: 'line' },
    style: { border: { fg: 'green' } },
    mouse: true,
  });

  const inputBox = blessed.textbox({
    bottom: 0,
    left: '0%',
    width: '100%',
    height: '20%',
    label: 'Input - Type message and press Enter (F2 to focus)',
    border: { type: 'line' },
    style: {
      border: { fg: 'yellow' },
      focus: { border: { fg: 'white' } },
    },
    inputOnFocus: true,
  });

  screen.append(outputLog);
  screen.append(statusBox);
  screen.append(inputBox);

  return { screen, outputLog, statusBox, inputBox };
};

const runWorkflow = async (
  currentMessage: string,
  runner: any,
  outputLog: blessed.Widgets.Log,
  statusBox: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  inputBox: blessed.Widgets.TextboxElement,
) => {
  outputLog.setContent('');
  outputLog.log('{bold}Starting new workflow...{/bold}\n');
  outputLog.log(`Your request: ${currentMessage}\n`);
  screen.render();

  const { stdout, stderr } = createOutputStreams(outputLog, screen);
  const customConsole = new console.Console(stdout, stderr);
  const originalConsole = console;
  global.console = customConsole;

  try {
    const result = await runner.runWorkflow({
      messages: [new HumanMessage(currentMessage)],
    });

    global.console = originalConsole;
    outputLog.log('\n{bold}Workflow completed{/bold}');
    statusBox.setContent('Workflow completed. Enter new message to start another.');
  } catch (error) {
    global.console = originalConsole;
    throw error;
  }

  screen.render();
  inputBox.focus();
};

(async () => {
  try {
    await validateLocalHash();
    const runner = await orchestratorRunner();
    const { screen, outputLog, statusBox, inputBox } = createUI();
    const state = {
      value: '', // Changed from currentMessage to value
      isProcessing: false,
    };

    setupKeyBindings(screen, outputLog, inputBox, statusBox, state);

    inputBox.on('submit', (value: string) => {
      if (value.trim()) {
        state.value = value; // Using value instead of currentMessage
        statusBox.setContent('Current Message: ' + value);
        state.isProcessing = false;
      }
      inputBox.clearValue();
      inputBox.focus();
      screen.render();
    });

    // Run the workflow loop in parallel
    (async () => {
      while (true) {
        if (state.value && !state.isProcessing) {
          state.isProcessing = true;
          try {
            await runWorkflow(state.value, runner, outputLog, statusBox, screen, inputBox);
            state.value = ''; // Using value instead of currentMessage
            state.isProcessing = false;
          } catch (error: any) {
            outputLog.log('\n{red-fg}Error:{/red-fg} ' + error.message);
            statusBox.setContent('Error occurred. Enter new message to retry.');
            screen.render();
            inputBox.focus();
            await new Promise(res => setTimeout(res, 5000));
            state.value = ''; // Using value instead of currentMessage
            state.isProcessing = false;
          }
        } else {
          await new Promise(res => setTimeout(res, 1000));
        }
      }
    })();

    inputBox.focus();
    screen.render();
  } catch (error: any) {
    console.error('Failed to initialize interactive CLI:', error);
    process.exit(1);
  }
})();
