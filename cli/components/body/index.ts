import blessed from 'blessed';
import { createInputBox } from './InputBox.js';
import { createStatusBox } from './StatusBox.js';
import { createScheduledTasksBox } from './ScheduledTasksBox.js';
import { createTooltipBox } from './TooltipBox.js';
import { createConfirmDialog } from './ConfirmDialog.js';
import { setupTaskDeletion } from './taskDeletion.js';

export const createBottomArea = () => {
  // Main container
  const container = blessed.box({
    bottom: 2, // Space for help box
    left: 0,
    width: '100%',
    height: '40%', // Use percentage without subtracting for better responsiveness
  });

  // Split into left and right sections
  const leftSection = blessed.box({
    top: 0,
    left: 0,
    width: '50%',
    height: '90%', // Use full height
  });

  const rightSection = blessed.box({
    top: 0,
    right: 0,
    width: '50%',
    height: '90%', // Use full height
  });

  // Create components
  const statusBox = createStatusBox();
  const inputBox = createInputBox();
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
