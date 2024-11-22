import { createThreadStorage } from './threadStorage';

export type ThreadStorage = ReturnType<typeof createThreadStorage>;
