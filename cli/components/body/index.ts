import blessed from 'blessed';
import { createInputBox } from './InputBox.js';
import { createStatusBox } from './StatusBox.js';
import { createScheduledTasksBox } from './ScheduledTasksBox.js';
import { createTooltipBox } from './TooltipBox.js';
import { createConfirmDialog } from './ConfirmDialog.js';
import { setupTaskDeletion } from './taskDeletion.js';

export const createBottomArea = () => {
  const container = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: '35%',
  });

  // Split into left and right sections
  const leftSection = blessed.box({
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
  });

  const rightSection = blessed.box({
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
  });

  // Create components
  const inputBox = createInputBox();
  const statusBox = createStatusBox();
  const scheduledTasksBox = createScheduledTasksBox();
  const tooltipBox = createTooltipBox();
  const confirmDialog = createConfirmDialog();

  // Setup task deletion handling
  setupTaskDeletion(scheduledTasksBox, confirmDialog);

  // Append components to their sections
  leftSection.append(statusBox);
  leftSection.append(inputBox);
  rightSection.append(scheduledTasksBox);
  rightSection.append(tooltipBox);

  // Append sections to container
  container.append(leftSection);
  container.append(rightSection);

  return {
    container,
    inputBox,
    statusBox,
    scheduledTasksBox,
    confirmDialog,
  };
};
