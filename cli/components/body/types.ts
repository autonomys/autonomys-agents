import blessed from 'blessed';

export interface ListItem {
  content: string;
  [key: string]: any;
}

export interface ExtendedList extends blessed.Widgets.ListElement {
  items: ListItem[];
  selected: number;
  removeItem(index: number): blessed.Widgets.ListElement;
  spliceItem(index: number, count: number): void;
  getItemIndex(index: number): number;
}
