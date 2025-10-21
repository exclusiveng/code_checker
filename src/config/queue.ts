import { Queue } from 'bullmq';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

// If you set USE_IN_MEMORY_QUEUE=1 we use a lightweight in-process queue which
// keeps jobs in memory and not require Redis. This is meant for single-process
// deployments (server+worker in same process) and is NOT suitable for multi-
// instance production setups.

let _submissionQueue: any = null;
let _inMemoryListeners: Array<(job: { id: string; name: string; data: any }) => Promise<any>> = [];

class InMemoryQueue {
  async add(name: string, data: any) {
    const job = { id: randomUUID(), name, data };
    // schedule delivery on next tick so caller doesn't block
    setImmediate(() => {
      for (const l of _inMemoryListeners) {
        l(job).catch((err) => console.error('InMemoryQueue job handler error', err));
      }
    });
    return job;
  }

  // compatibility helper; BullMQ has many methods but we only need `add` here
}

export function subscribeInMemorySubmissionProcessor(fn: (job: { id: string; name: string; data: any }) => Promise<any>) {
  _inMemoryListeners.push(fn);
}

export function getSubmissionQueue(): any {
  if (_submissionQueue) return _submissionQueue;
  // If the user explicitly requests the in-memory queue OR no Redis config is
  // provided, use the in-memory queue. This prevents accidental attempts to
  // connect to localhost:6379 when Redis isn't intended to be used.
  const hasRedisConfig = !!process.env.REDIS_HOST || !!process.env.REDIS_URL || !!process.env.REDIS_PORT;
  const forceInMemory = process.env.USE_IN_MEMORY_QUEUE === '1';

  if (forceInMemory || !hasRedisConfig) {
    _submissionQueue = new InMemoryQueue();
    return _submissionQueue;
  }

  // Use BullMQ Queue (requires Redis) when explicit Redis config is present
  const connection = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      };

  _submissionQueue = new Queue('submission-analysis', { connection });
  return _submissionQueue as Queue;
}
