import { orchestratorRunner } from '../src/agent.js';
import { validateLocalHash } from '../src/agents/tools/utils/localHashStorage.js';
import { createUI } from './components/ui.js';
import { setupKeyBindings } from './handlers/keyBindings.js';
import { runWorkflow } from './handlers/workflow.js';
import { AppState } from './types/types.js';
import { Mutex } from 'async-mutex';

(async () => {
  try {
    await validateLocalHash();
    const runner = await orchestratorRunner();
    const ui = createUI();
    const state: AppState = {
      value: '',
      isProcessing: false,
      scheduledTasks: [],
      mutex: new Mutex(),
    };

    setupKeyBindings(ui, state);

    // Handle new line with Ctrl+n
    ui.inputBox.key(['C-n'], () => {
      const currentValue = ui.inputBox.getValue();
      ui.inputBox.setValue(currentValue + '\n');
      ui.screen.render();
    });

    // Handle submission with Enter
    ui.inputBox.key(['return'], async () => {
      const value = ui.inputBox.getValue();
      if (value.trim()) {
        const release = await state.mutex.acquire();
        try {
          // If a workflow is already processing or there are tasks in the queue, add to scheduled tasks
          if (state.isProcessing || state.scheduledTasks.length > 0) {
            const nextRunTime = new Date();
            state.scheduledTasks.push({
              time: nextRunTime,
              description: value,
            });
            const formattedTime = nextRunTime.toISOString();
            ui.scheduledTasksBox.addItem(`${formattedTime} - ${value}`);
            ui.scheduledTasksBox.scrollTo(Number((ui.scheduledTasksBox as any).ritems.length - 1));
            ui.statusBox.setContent('System busy - Task added to queue');
            ui.outputLog.log('{yellow-fg}Task queued for later execution{/yellow-fg}');
          } else {
            state.value = value;
            ui.statusBox.setContent('Current Message: ' + value);
            ui.outputLog.log('{cyan-fg}Starting new task...{/cyan-fg}');
          }
        } finally {
          release();
        }
        ui.inputBox.clearValue();
        ui.inputBox.focus();
        ui.screen.render();
      }
    });

    // Run the workflow loop in parallel
    (async () => {
      while (true) {
        let valueToProcess = '';

        // First, check if we have a new task to start
        const release = await state.mutex.acquire();
        try {
          if (state.value && !state.isProcessing) {
            state.isProcessing = true;
            valueToProcess = state.value; // Store value before clearing
            state.value = ''; // Clear value before releasing mutex
          }
        } finally {
          release();
        }

        // Then run the workflow outside the mutex if we have something to process
        if (valueToProcess) {
          try {
            await runWorkflow(valueToProcess, runner, ui, state);
          } catch (error: any) {
            ui.outputLog.log('\n{red-fg}Error:{/red-fg} ' + error.message);
            ui.statusBox.setContent('Error occurred. Enter new message to retry.');
            ui.screen.render();
            ui.inputBox.focus();
          } finally {
            // Clear processing flag after workflow completes
            const release = await state.mutex.acquire();
            try {
              state.isProcessing = false;
            } finally {
              release();
            }
          }
        }

        await new Promise(res => setTimeout(res, 1000));
      }
    })();

    // Run the scheduler loop in parallel
    (async () => {
      while (true) {
        await new Promise(res => setTimeout(res, 1000));

        const now = new Date();
        const release = await state.mutex.acquire();
        try {
          if (!state.isProcessing && state.scheduledTasks.length > 0) {
            // Sort tasks by scheduled time and get all tasks that were due
            const dueTasks = state.scheduledTasks
              .sort((a, b) => a.time.getTime() - b.time.getTime())
              .filter(task => task.time <= now);

            if (dueTasks.length > 0) {
              const task = dueTasks[0]; // Get the earliest scheduled task
              state.scheduledTasks = state.scheduledTasks.filter(t => t !== task);
              state.isProcessing = true;

              // Log if task is overdue
              const delayMinutes = Math.floor((now.getTime() - task.time.getTime()) / (1000 * 60));
              if (delayMinutes > 0) {
                const scheduledTime = task.time.toISOString();
                ui.outputLog.log(
                  `{yellow-fg}Task was scheduled for ${scheduledTime} (${delayMinutes} minutes ago){/yellow-fg}`,
                );
              }

              try {
                ui.outputLog.log('{cyan-fg}Starting scheduled task...{/cyan-fg}');
                ui.statusBox.setContent(`Executing scheduled task: ${task.description}`);
                ui.screen.render();
                await runWorkflow(task.description, runner, ui, state);
              } catch (error: any) {
                ui.outputLog.log('\n{red-fg}Scheduled task error:{/red-fg} ' + error.message);
                ui.statusBox.setContent('Error occurred in scheduled task. Check log for details.');
                ui.screen.render();
              } finally {
                state.isProcessing = false;
              }
            }
          }
        } finally {
          release();
        }
        // Update clock with ISO format time and date
        const timeStr = now.toISOString();
        ui.clockBox.setContent(timeStr);
        ui.screen.render();
      }
    })();

    ui.inputBox.focus();
    ui.screen.render();
  } catch (error: any) {
    console.error('Failed to initialize interactive CLI:', error);
    process.exit(1);
  }
})();
