import { Console } from 'console';
import { HumanMessage } from '@langchain/core/messages';
import { UIComponents, AppState } from '../types/types.js';
import { Writable } from 'stream';
import blessed from 'blessed';

// Create custom output streams that write to the blessed log
const createOutputStreams = (outputLog: blessed.Widgets.Log, screen: blessed.Widgets.Screen) => {
  const createStream = () =>
    new Writable({
      write(chunk, encoding, callback) {
        outputLog.add(chunk.toString());
        screen.render();
        callback();
      },
    });

  return {
    stdout: createStream(),
    stderr: createStream(),
  };
};

export const runWorkflow = async (
  currentMessage: string,
  runner: any,
  ui: UIComponents,
  state: AppState,
) => {
  const { outputLog, statusBox, screen, inputBox, scheduledTasksBox } = ui;

  outputLog.setContent('');
  outputLog.log('{bold}Starting new workflow...{/bold}\n');
  outputLog.log(`Your request: ${currentMessage}\n`);
  screen.render();

  const { stdout, stderr } = createOutputStreams(outputLog, screen);
  const customConsole = new Console(stdout, stderr);
  const originalConsole = console;
  global.console = customConsole;

  try {
    const result = await runner.runWorkflow({
      messages: [new HumanMessage(currentMessage)],
    });

    global.console = originalConsole;
    outputLog.log('\n{bold}Workflow completed{/bold}');

    if (result.nextWorkflowPrompt && result.secondsUntilNextWorkflow) {
      const nextDelaySeconds = result.secondsUntilNextWorkflow;
      const nextRunTime = new Date(Date.now() + nextDelaySeconds * 1000);

      const release = await state.mutex.acquire();
      try {
        state.scheduledTasks.push({
          time: nextRunTime,
          description: result.nextWorkflowPrompt,
        });

        const formattedTime = nextRunTime.toISOString();
        scheduledTasksBox.addItem(`${formattedTime} - ${result.nextWorkflowPrompt}`);
        scheduledTasksBox.scrollTo(Number((scheduledTasksBox as any).ritems.length - 1));
        statusBox.setContent('Workflow completed. Next task scheduled.');
      } finally {
        release();
      }
    } else {
      statusBox.setContent('Workflow completed. Enter new message to start another.');
    }
  } catch (error) {
    global.console = originalConsole;
    throw error;
  } finally {
    // Ensure processing state is reset
    const release = await state.mutex.acquire();
    try {
      state.isProcessing = false;
    } finally {
      release();
    }
    screen.render();
    inputBox.focus();
  }
};
