import blessed from 'blessed';

// Add type definitions for blessed list items
interface ListItem {
  content: string;
  [key: string]: any;
}

// Update the interface to match blessed's actual types
interface ExtendedList extends blessed.Widgets.ListElement {
  items: ListItem[];
  selected: number;
  removeItem(index: number): blessed.Widgets.ListElement;
}

export const createScheduledTasksBox = () => {
  const box = blessed.list({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%', // Use full height
    label: 'Scheduled Tasks (Ctrl+T: focus, ↑/↓: navigate, d: delete)',
    border: { type: 'line' },
    style: {
      border: { fg: 'magenta' },
      selected: { bg: 'blue' },
      item: { hover: { bg: 'blue' } },
    },
    scrollable: true,
    scrollbar: {
      ch: ' ',
      style: { inverse: true },
    },
    padding: {
      left: 1,
      right: 1,
    },
    mouse: true,
    keys: true,
    vi: true,
    items: [],
    wrap: true,
    alwaysScroll: true,
    scrollHorizontal: true,
    itemHeight: 2,
    formatItem: (item: string) => {
      const maxLength = (box.width as number) - 4;
      if (item.length > maxLength) {
        return item.substring(0, maxLength - 3) + '...';
      }
      return item;
    },
  }) as unknown as ExtendedList;

  return box;
};
