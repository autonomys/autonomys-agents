import { orchestratorRunner } from '../src/agent.js';
import { validateLocalHash } from '../src/agents/tools/utils/localHashStorage.js';
import { createUI } from './components/ui.js';
import { setupKeyBindings } from './handlers/keyBindings.js';
import { runWorkflow } from './handlers/workflow.js';
import { AppState } from './types/types.js';

(async () => {
  try {
    await validateLocalHash();
    const runner = await orchestratorRunner();
    const ui = createUI();
    const state: AppState = {
      value: '',
      isProcessing: false,
      scheduledTasks: [],
    };

    setupKeyBindings(ui, state);

    // Handle Ctrl+Enter for submission
    ui.inputBox.key(['C-enter'], () => {
      const value = ui.inputBox.getValue();
      if (value.trim()) {
        state.value = value;
        ui.statusBox.setContent('Current Message: ' + value);
        state.isProcessing = false;
      }
      ui.inputBox.clearValue();
      ui.inputBox.focus();
      ui.screen.render();
    });

    // Run the workflow loop in parallel
    (async () => {
      while (true) {
        if (state.value && !state.isProcessing) {
          state.isProcessing = true;
          try {
            await runWorkflow(state.value, runner, ui, state);
            state.value = '';
            state.isProcessing = false;
          } catch (error: any) {
            ui.outputLog.log('\n{red-fg}Error:{/red-fg} ' + error.message);
            ui.statusBox.setContent('Error occurred. Enter new message to retry.');
            ui.screen.render();
            ui.inputBox.focus();
            await new Promise(res => setTimeout(res, 5000));
            state.value = '';
            state.isProcessing = false;
          }
        } else {
          await new Promise(res => setTimeout(res, 1000));
        }
      }
    })();

    // Run the scheduler loop in parallel
    (async () => {
      while (true) {
        const now = new Date();
        const dueTasks = state.scheduledTasks.filter(task => task.time <= now);

        // Update clock with colored time
        const timeStr = now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        ui.clockBox.setContent(timeStr);
        ui.screen.render();

        for (const task of dueTasks) {
          if (!state.isProcessing) {
            state.isProcessing = true;
            try {
              // Remove task from list
              state.scheduledTasks = state.scheduledTasks.filter(t => t !== task);
              // Execute the task
              await runWorkflow(task.description, runner, ui, state);
            } catch (error: any) {
              ui.outputLog.log('\n{red-fg}Scheduled task error:{/red-fg} ' + error.message);
            } finally {
              state.isProcessing = false;
            }
          }
        }
        await new Promise(res => setTimeout(res, 1000));
      }
    })();

    ui.inputBox.focus();
    ui.screen.render();
  } catch (error: any) {
    console.error('Failed to initialize interactive CLI:', error);
    process.exit(1);
  }
})();
