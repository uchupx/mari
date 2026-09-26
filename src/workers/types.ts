export interface ChapterDownloadPayload {
  mangaId: number;
  chapterId: number;
  /** Ordered list of fully-resolved page image URLs (built on main thread) */
  pageUrls: string[];
}
export interface ChapterDownloadResult {
  status: string;
  error?: string;
  data?: Record<number, string>;
  mangaId: number;
  chapterId: number;
}

export interface TaskRegistry {
  chapterDownload: {
    payload: ChapterDownloadPayload;
    result: ChapterDownloadResult;
  };
}

export type TaskName = keyof TaskRegistry;
export type TaskPayload<T extends TaskName> = TaskRegistry[T]['payload'];
export type TaskResult<T extends TaskName> = TaskRegistry[T]['result'];

export interface WorkerInMessage<T extends TaskName = TaskName> {
  id: string;
  action: T;
  payload: TaskPayload<T>;
}

export interface WorkerOutMessage<T extends TaskName = TaskName> {
  id: string;
  action: T;
  result?: TaskResult<T>;
  error?: string;
}
