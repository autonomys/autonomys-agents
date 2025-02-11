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

    ui.inputBox.on('submit', (value: string) => {
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

    ui.inputBox.focus();
    ui.screen.render();
  } catch (error: any) {
    console.error('Failed to initialize interactive CLI:', error);
    process.exit(1);
  }
})();
