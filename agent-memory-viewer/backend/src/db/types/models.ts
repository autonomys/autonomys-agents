export interface MemoryRecord {
  id: number;
  cid: string;
  content: any;
  created_at: Date;
  agent_name: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
