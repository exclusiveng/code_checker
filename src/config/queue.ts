import { Queue } from 'bullmq';
import * as dotenv from 'dotenv';

dotenv.config();

let _submissionQueue: Queue | null = null;

export function getSubmissionQueue(): Queue {
  if (_submissionQueue) return _submissionQueue;

  const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  };

  _submissionQueue = new Queue('submission-analysis', { connection });
  return _submissionQueue;
}
