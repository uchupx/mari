import type { WorkerInMessage, WorkerOutMessage, TaskRegistry } from './types';
import { pageDownloadWorker } from './pageDownloadWorker';
import { checkUpdateWorker } from './checkUpdateWorker';

self.onmessage = async (e: MessageEvent<WorkerInMessage>) => {
  const { id, action, payload } = e.data;

  try {
    let result: any;

    switch (action) {
      case 'chapterDownload': {
        const p = payload as TaskRegistry['chapterDownload']['payload'];
        result = await pageDownloadWorker(p, (progress) => {
          const progressMsg: WorkerOutMessage = {
            id,
            action,
            type: 'progress',
            progress,
          };
          self.postMessage(progressMsg);
        });
        break;
      }
      case 'checkUpdate': {
        const p = payload as TaskRegistry['checkUpdate']['payload'];
        result = await checkUpdateWorker(p);
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response: WorkerOutMessage = { id, action, type: 'result', result };
    self.postMessage(response);
  } catch (err: any) {
    const response: WorkerOutMessage = {
      id,
      action,
      type: 'result',
      error: err.message || 'Worker processing failed',
    };

    self.postMessage(response);
  }
};
