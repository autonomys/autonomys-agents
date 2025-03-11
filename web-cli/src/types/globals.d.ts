interface EventSourceInit {
  withCredentials?: boolean;
}

// Add declaration for localStorage to global namespace
interface Window {
  localStorage: Storage;
}

// Declare localStorage as a global variable
// This syntax is more likely to be recognized by ESLint
declare var localStorage: Storage;

interface EventSource extends EventTarget {
  readonly CLOSED: number;
  readonly CONNECTING: number;
  readonly OPEN: number;
  readonly readyState: number;
  readonly url: string;
  readonly withCredentials: boolean;
  onopen: ((this: EventSource, ev: Event) => any) | null;
  onmessage: ((this: EventSource, ev: MessageEvent) => any) | null;
  onerror: ((this: EventSource, ev: Event) => any) | null;
  addEventListener<K extends keyof EventSourceEventMap>(
    type: K,
    listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof EventSourceEventMap>(
    type: K,
    listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
  close(): void;
}

interface EventSourceEventMap {
  error: Event;
  message: MessageEvent;
  open: Event;
}

declare var EventSource: {
  prototype: EventSource;
  new (url: string, eventSourceInitDict?: EventSourceInit): EventSource;
  readonly CLOSED: number;
  readonly CONNECTING: number;
  readonly OPEN: number;
};

declare var fetch: typeof fetch;
