import { spawn } from 'child_process';
import { UIComponents, AppState } from '../types/types.js';

export const setupKeyBindings = (ui: UIComponents, state: AppState) => {
  const { screen, outputLog, inputBox, statusBox, searchBox, scheduledTasksBox } = ui;
  let currentSearchResults: { pos: number; matchedText: string }[] = [];
  let currentSearchIndex = -1;
  let lastSearchTerm = '';
  let fullHistory: string[] = [];
  let originalContent = '';

  outputLog.on('log', (msg: string) => {
    fullHistory.push(msg);
    originalContent = fullHistory.join('\n');
  });

  const highlightCurrentMatch = () => {
    if (currentSearchResults.length === 0 || currentSearchIndex === -1) return;

    const { pos, matchedText } = currentSearchResults[currentSearchIndex];
    const lines = originalContent.slice(0, pos).split('\n');
    const targetLine = lines.length;

    const height = (outputLog.height as number) - 2; // Account for borders
    const currentScroll = outputLog.getScroll();
    const bottomVisible = currentScroll + height;

    const currentScrollPos = outputLog.getScroll();

    if (targetLine < currentScroll || targetLine >= bottomVisible) {
      const newScrollPos = Math.max(0, targetLine - Math.floor(height / 2));
      outputLog.scrollTo(newScrollPos);

      setTimeout(() => {
        outputLog.scrollTo(newScrollPos);
        screen.render();
      }, 10);
    }

    const beforeMatch = originalContent.slice(0, pos);
    const afterMatch = originalContent.slice(pos + matchedText.length);

    outputLog.setContent(
      beforeMatch + '{black-bg}{yellow-fg}' + matchedText + '{/yellow-fg}{/black-bg}' + afterMatch,
    );

    if (targetLine >= currentScroll && targetLine < bottomVisible) {
      outputLog.scrollTo(currentScrollPos);
    }

    screen.render();
  };

  const performSearch = (searchTerm: string, moveToNext: boolean = false) => {
    if (!searchTerm) return;

    lastSearchTerm = searchTerm;
    const cleanContent = originalContent.replace(/\{[^}]+\}/g, '');

    const results: { pos: number; matchedText: string }[] = [];
    let pos = 0;
    const searchTermLower = searchTerm.toLowerCase();
    const contentLower = cleanContent.toLowerCase();

    while ((pos = contentLower.indexOf(searchTermLower, pos)) !== -1) {
      // Store the actual matched text from the original content
      const matchedText = cleanContent.slice(pos, pos + searchTerm.length);
      results.push({ pos, matchedText });
      pos += 1;
    }

    if (results.length > 0) {
      currentSearchResults = results;
      if (moveToNext) {
        currentSearchIndex = (currentSearchIndex + 1) % results.length;
      } else {
        currentSearchIndex = 0;
      }

      statusBox.setContent(
        `Found ${results.length} matches (${currentSearchIndex + 1}/${results.length}). Press down for next, up for previous.`,
      );

      highlightCurrentMatch();
    } else {
      statusBox.setContent(`No matches found for "${searchTerm}"`);
      outputLog.setContent(originalContent);
      screen.render();
    }
  };

  inputBox.key(['C-n'], () => {
    const currentValue = inputBox.getValue();
    inputBox.setValue(currentValue + '\n');
    screen.render();
  });

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

  screen.key(['C-c'], () => process.exit(0));

  screen.key(['down'], () => {
    if (lastSearchTerm && currentSearchResults.length > 0) {
      currentSearchIndex = (currentSearchIndex + 1) % currentSearchResults.length;
      statusBox.setContent(
        `Found ${currentSearchResults.length} matches (${currentSearchIndex + 1}/${currentSearchResults.length}). Press down for next, up for previous.`,
      );
      highlightCurrentMatch();
    }
  });

  screen.key(['up'], () => {
    if (lastSearchTerm && currentSearchResults.length > 0) {
      currentSearchIndex =
        (currentSearchIndex - 1 + currentSearchResults.length) % currentSearchResults.length;
      statusBox.setContent(
        `Found ${currentSearchResults.length} matches (${currentSearchIndex + 1}/${currentSearchResults.length}). Press down for next, up for previous.`,
      );
      highlightCurrentMatch();
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
};
