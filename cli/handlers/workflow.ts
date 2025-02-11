import { HumanMessage } from '@langchain/core/messages';
import { Console } from 'console';
import { Writable } from 'stream';
import blessed from 'blessed';
import { UIComponents, AppState } from '../types/types.js';

export const createOutputStreams = (
  outputLog: blessed.Widgets.Log,
  screen: blessed.Widgets.Screen,
) => {
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

    // Add the next scheduled task to the list
    const nextDelaySeconds = result.secondsUntilNextWorkflow ?? 300;
    const nextRunTime = new Date(Date.now() + nextDelaySeconds * 1000);
    const taskDescription = result.nextWorkflowPrompt ?? currentMessage;

    // Update state with new scheduled task
    state.scheduledTasks.push({
      time: nextRunTime,
      description: taskDescription,
    });

    // Update UI
    const formattedTime = nextRunTime.toLocaleTimeString();
    scheduledTasksBox.addItem(`${formattedTime} - ${taskDescription.slice(0, 50)}...`);
    scheduledTasksBox.scrollTo(Number((scheduledTasksBox as any).ritems.length - 1));

    statusBox.setContent('Workflow completed. Enter new message to start another.');
  } catch (error) {
    global.console = originalConsole;
    throw error;
  }

  screen.render();
  inputBox.focus();
};
