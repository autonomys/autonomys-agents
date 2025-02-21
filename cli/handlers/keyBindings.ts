import { spawn } from 'child_process';
import { UIComponents, AppState } from '../types/types.js';

export const setupKeyBindings = (ui: UIComponents, state: AppState) => {
  const { screen, outputLog, inputBox, statusBox, searchBox, scheduledTasksBox } = ui;
  let currentSearchResults: number[] = [];
  let currentSearchIndex = -1;
  let lastSearchTerm = '';

  const performSearch = (searchTerm: string, moveToNext: boolean = false) => {
    if (!searchTerm) return;

    lastSearchTerm = searchTerm;
    const content = outputLog.getContent();
    // Remove existing highlights
    const cleanContent = content.replace(/\{yellow-bg\}|\{\/yellow-bg\}/g, '');

    // Find all occurrences
    const results: number[] = [];
    let pos = 0;
    while ((pos = cleanContent.toLowerCase().indexOf(searchTerm.toLowerCase(), pos)) !== -1) {
      results.push(pos);
      pos += 1;
    }

    if (results.length > 0) {
      currentSearchResults = results;
      if (moveToNext) {
        currentSearchIndex = (currentSearchIndex + 1) % results.length;
      } else {
        currentSearchIndex = 0;
      }

      // Highlight all occurrences
      let highlightedContent = cleanContent;
      for (let i = results.length - 1; i >= 0; i--) {
        const pos = results[i];
        highlightedContent =
          highlightedContent.slice(0, pos) +
          '{yellow-bg}' +
          highlightedContent.slice(pos, pos + searchTerm.length) +
          '{/yellow-bg}' +
          highlightedContent.slice(pos + searchTerm.length);
      }

      outputLog.setContent(highlightedContent);

      // Scroll to current result
      const lines = cleanContent.slice(0, results[currentSearchIndex]).split('\n').length;
      outputLog.scrollTo(lines - 1);

      statusBox.setContent(
        `Found ${results.length} matches (${currentSearchIndex + 1}/${results.length}). Press down for next, up for previous.`,
      );
    } else {
      statusBox.setContent(`No matches found for "${searchTerm}"`);
    }

    screen.render();
  };

  // Handle new line with Ctrl+n
  inputBox.key(['C-n'], () => {
    const currentValue = inputBox.getValue();
    inputBox.setValue(currentValue + '\n');
    screen.render();
  });

  // Handle submission with Enter
  inputBox.key('return', async () => {
    const value = inputBox.getValue();
    if (value.trim()) {
      const release = await state.mutex.acquire();
      try {
        if (state.isProcessing || state.scheduledTasks.length > 0) {
          const nextRunTime = new Date();
          state.scheduledTasks.push({
            time: nextRunTime,
            description: value,
          });
          const formattedTime = nextRunTime.toISOString();
          scheduledTasksBox.addItem(`${formattedTime} - ${value}`);
          scheduledTasksBox.scrollTo(Number((scheduledTasksBox as any).ritems.length - 1));
          statusBox.setContent('System busy - Task added to queue');
          outputLog.log('{yellow-fg}Task queued for later execution{/yellow-fg}');
        } else {
          state.value = value;
          statusBox.setContent('Current Message: ' + value);
          outputLog.log('{cyan-fg}Starting new task...{/cyan-fg}');
        }
      } finally {
        release();
      }
      inputBox.clearValue();
      inputBox.focus();
      screen.render();
    }
  });

  // Quit bindings
  screen.key(['q', 'C-c'], () => process.exit(0));

  // Input focus binding
  screen.key(['C-i'], () => {
    inputBox.focus();
    screen.render();
  });

  // Search navigation
  screen.key(['down'], () => {
    if (lastSearchTerm) {
      performSearch(lastSearchTerm, true);
    }
  });

  screen.key(['up'], () => {
    if (lastSearchTerm && currentSearchResults.length > 0) {
      currentSearchIndex =
        (currentSearchIndex - 1 + currentSearchResults.length) % currentSearchResults.length;
      performSearch(lastSearchTerm, false);
    }
  });

  // Handle search box input
  searchBox.on('submit', () => {
    const searchTerm = searchBox.getValue().replace('Search: ', '').trim();
    if (searchTerm) {
      performSearch(searchTerm);
    }
  });

  // Scroll bindings
  screen.key(['C-b'], () => {
    outputLog.scroll(-Number(outputLog.height));
    screen.render();
  });

  screen.key(['C-p'], () => {
    outputLog.scroll(-1);
    screen.render();
  });

  screen.key(['C-n'], () => {
    outputLog.scroll(1);
    screen.render();
  });
};
