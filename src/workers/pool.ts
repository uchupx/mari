import type {
  TaskName,
  TaskPayload,
  TaskResult,
  WorkerInMessage,
  WorkerOutMessage,
} from './types';

interface InternalTask {
  id: string;
  action: TaskName;
  payload: any;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

interface ManagedWorker {
  worker: Worker;
  busy: boolean;
  currentTaskId: string | null;
}

export class WorkerPool {
  private workers: ManagedWorker[] = [];
  private queue: InternalTask[] = [];
  private activeTasks = new Map<string, InternalTask>();

  constructor(
    workerScriptUrl: URL,
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {
    this.initPool(workerScriptUrl);
  }

  private initPool(url: URL) {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(url, { type: 'module' });
      const managed: ManagedWorker = {
        worker,
        busy: false,
        currentTaskId: null,
      };

      worker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
        this.handleMessage(managed, e.data);
      };

      worker.onerror = (err) => {
        if (managed.currentTaskId) {
          const task = this.activeTasks.get(managed.currentTaskId);
          task?.reject(err);
          this.activeTasks.delete(managed.currentTaskId);
        }
        managed.busy = false;
        managed.currentTaskId = null;
        this.processNext();
      };

      this.workers.push(managed);
    }
  }

  private handleMessage(managed: ManagedWorker, data: WorkerOutMessage) {
    const { id, result, error } = data;
    const task = this.activeTasks.get(id);

    if (task) {
      if (error) {
        task.reject(new Error(error));
      } else {
        task.resolve(result);
      }
      this.activeTasks.delete(id);
    }

    managed.busy = false;
    managed.currentTaskId = null;
    this.processNext();
  }

  public dispatch<T extends TaskName>(
    action: T,
    payload: TaskPayload<T>
  ): Promise<TaskResult<T>> {
    return new Promise<TaskResult<T>>((resolve, reject) => {
      const id = crypto.randomUUID();
      this.queue.push({ id, action, payload, resolve, reject });
      this.processNext();
    });
  }

  private processNext() {
    if (this.queue.length === 0) return;

    const availableWorker = this.workers.find((w) => !w.busy);
    if (!availableWorker) return;

    const task = this.queue.shift()!;
    availableWorker.busy = true;
    availableWorker.currentTaskId = task.id;

    this.activeTasks.set(task.id, task);

    const message: WorkerInMessage = {
      id: task.id,
      action: task.action,
      payload: task.payload,
    };
    availableWorker.worker.postMessage(message);
  }

  public terminate() {
    for (const item of this.workers) {
      item.worker.terminate();
    }
    this.workers = [];
    this.queue = [];
    this.activeTasks.clear();
  }
}
