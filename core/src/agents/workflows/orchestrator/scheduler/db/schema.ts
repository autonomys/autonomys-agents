export const TASKS_TABLE_SCHEMA = `
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  scheduled_for DATETIME NOT NULL,
  started_at DATETIME,
  completed_at DATETIME,
  result TEXT,
  error TEXT
`;

export function createTaskTableIndexes(namespace: string): string[] {
  return [
    `CREATE INDEX IF NOT EXISTS idx_${namespace}_status ON tasks_${namespace} (status)`,
    `CREATE INDEX IF NOT EXISTS idx_${namespace}_scheduled ON tasks_${namespace} (scheduled_for)`,
  ];
}
