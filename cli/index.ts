import { orchestratorRunner } from '../src/agent.js';
import { validateLocalHash } from '../src/blockchain/localHashStorage.js';
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

    (async () => {
      while (true) {
        let valueToProcess = '';

        const release = await state.mutex.acquire();
        try {
          if (state.value && !state.isProcessing) {
            state.isProcessing = true;
            valueToProcess = state.value;
            state.value = '';
          }
        } finally {
          release();
        }

        if (valueToProcess) {
          try {
            await runWorkflow(valueToProcess, runner, ui, state);
          } catch (error: any) {
            ui.outputLog.log('\n{red-fg}Error:{/red-fg} ' + error.message);
            ui.statusBox.setContent('Error occurred. Enter new message to retry.');
            ui.screen.render();
          } finally {
            const release = await state.mutex.acquire();
            try {
              state.isProcessing = false;
            } finally {
              release();
            }
            ui.inputBox.focus();
            ui.screen.render();
          }
        }

        await new Promise(res => setTimeout(res, 1000));
      }
    })();

    (async () => {
      while (true) {
        await new Promise(res => setTimeout(res, 1000));

        let taskToProcess: { time: Date; description: string } | null = null;
        const now = new Date();

        const release = await state.mutex.acquire();
        try {
          if (!state.isProcessing && state.scheduledTasks.length > 0) {
            const dueTasks = state.scheduledTasks
              .sort((a, b) => a.time.getTime() - b.time.getTime())
              .filter(task => task.time <= now);

            if (dueTasks.length > 0) {
              const nextTask = dueTasks[0];
              state.scheduledTasks = state.scheduledTasks.filter(t => t !== nextTask);

              const taskIndex = (ui.scheduledTasksBox as any).ritems.findIndex(
                (item: string) =>
                  item.includes(nextTask.time.toISOString()) && item.includes(nextTask.description),
              );
              if (taskIndex !== -1) {
                ui.scheduledTasksBox.removeItem(taskIndex);
              }

              taskToProcess = nextTask;
              state.isProcessing = true;
            }
          }
        } finally {
          release();
        }

        if (taskToProcess) {
          const delayMinutes = Math.floor(
            (now.getTime() - taskToProcess.time.getTime()) / (1000 * 60),
          );
          if (delayMinutes > 0) {
            ui.outputLog.log(
              `{yellow-fg}Task was scheduled for ${taskToProcess.time.toISOString()} (${delayMinutes} minutes ago){/yellow-fg}`,
            );
          }

          try {
            ui.outputLog.log('{cyan-fg}Starting scheduled task...{/cyan-fg}');
            ui.statusBox.setContent(`Executing scheduled task: ${taskToProcess.description}`);
            await runWorkflow(taskToProcess.description, runner, ui, state);
          } catch (error: any) {
            ui.outputLog.log('\n{red-fg}Scheduled task error:{/red-fg} ' + error.message);
            ui.statusBox.setContent('Error occurred in scheduled task. Check log for details.');
          } finally {
            const release = await state.mutex.acquire();
            try {
              state.isProcessing = false;
            } finally {
              release();
            }
          }
          ui.inputBox.focus();
          ui.screen.render();
        }

        ui.clockBox.setContent(now.toISOString());
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
