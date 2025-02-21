import blessed from 'blessed';
import { ExtendedList, ListItem } from './types.js';

export const setupTaskDeletion = (
  scheduledTasksBox: ExtendedList,
  confirmDialog: blessed.Widgets.QuestionElement,
) => {
  // Add key handler for deletion
  scheduledTasksBox.key(['d', 'D', 'delete'], () => {
    const selectedIndex = scheduledTasksBox.selected;
    if (selectedIndex === undefined || scheduledTasksBox.items.length === 0) {
      return;
    }

    const selectedTask = scheduledTasksBox.items[selectedIndex];

    // Show confirmation dialog and handle the response
    confirmDialog.show();
    const cleanContent = selectedTask.content.replace(/\n/g, ' ');
    confirmDialog.setContent(`Delete task: "${cleanContent}" (Y/N)?`);

    function handleConfirm(ch: string, key: blessed.Widgets.Events.IKeyEventArg) {
      if (ch === 'y' || ch === 'Y' || key.name === 'enter') {
        // First emit the deletion event so the queue can be updated
        scheduledTasksBox.emit('taskDeleted', selectedTask, selectedIndex);

        // Then update the UI
        scheduledTasksBox.spliceItem(selectedIndex, 1);

        // Update selection after deletion
        if (scheduledTasksBox.items.length > 0) {
          const newIndex = Math.min(selectedIndex, scheduledTasksBox.items.length - 1);
          scheduledTasksBox.select(newIndex);
        }

        // Clean up and emit action event
        confirmDialog.hide();
        confirmDialog.removeListener('keypress', handleConfirm);
        confirmDialog.emit('action');
        scheduledTasksBox.focus();
        scheduledTasksBox.screen.render();
      } else if (ch === 'n' || ch === 'N' || key.name === 'escape') {
        // Clean up and emit cancel event
        confirmDialog.hide();
        confirmDialog.removeListener('keypress', handleConfirm);
        confirmDialog.emit('cancel');
        scheduledTasksBox.focus();
        scheduledTasksBox.screen.render();
      }
    }

    confirmDialog.on('keypress', handleConfirm);
    confirmDialog.focus();
    scheduledTasksBox.screen.render();
  });
};
