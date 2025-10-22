import { Worker, Job } from 'bullmq';
import { subscribeInMemorySubmissionProcessor } from './config/queue';
import { AppDataSource } from './config/data-source';
import { Submission, SubmissionStatus } from './entities/submission.entity';
import { Project } from './entities/project.entity';
import { RuleSet } from './entities/ruleset.entity';
import { Rule, RuleSeverity } from './entities/rule.entity';
import { evaluateRulesAgainstZip, RuleFinding } from './services/rule-engine.service';
import * as dotenv from 'dotenv';
import { notificationService, NotificationEvent } from './services/notification.service';

dotenv.config();

// Global handlers to surface problems and avoid silent exits during dev.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection in worker:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception in worker:', err);
});

async function processSubmission(submissionId: string) {
  console.log(`Processing submission ${submissionId}`);

  const submissionRepository = AppDataSource.getRepository(Submission);
  const projectRepository = AppDataSource.getRepository(Project);
  const rulesetRepository = AppDataSource.getRepository(RuleSet);

  const submission = await submissionRepository.findOne({ where: { id: submissionId } });
  if (!submission) {
    console.warn(`Submission ${submissionId} not found`);
    return;
  }

  // Load all rulesets associated with the project
  const rulesets = await rulesetRepository.find({
    where: { projectId: submission.projectId },
    relations: ['rules'],
  });

  let rules: Rule[] = [];
  for (const ruleset of rulesets) {
    console.log(`Using ruleset "${ruleset.name}" (ID: ${ruleset.id}) for submission ${submissionId}`);
    rules.push(...(ruleset.rules || []));
  }

  // If no rules are found, fail the submission.
  if (rules.length === 0) {
    console.warn(`No rules found for project ${submission.projectId}. Marking submission as failed.`);
    submission.status = SubmissionStatus.FAILED;
    submission.results = {
      findings: [
        {
          ruleId: 'system-error',
          severity: RuleSeverity.ERROR,
          message: 'No ruleset is configured for this project. Analysis could not be performed.',
          locations: [],
        },
      ],
    };
    await submissionRepository.save(submission);
    return;
  }

  // Evaluate rules against the uploaded zip
  let findings: RuleFinding[] = [];
  let hasErrors = false;
  try {
    const evaluationResult = await evaluateRulesAgainstZip(submission.zipUrl, rules);
    findings = evaluationResult.findings;
    hasErrors = evaluationResult.hasErrors;
  } catch (evaluationError: any) {
    console.error(`Rule evaluation failed for submission ${submissionId}:`, evaluationError);
    findings = [];
    hasErrors = true;
    submission.results = {
      findings: [
        {
          ruleId: 'rule-evaluation-error',
          severity: 'error' as RuleSeverity,
          message: `Rule evaluation failed: ${evaluationError.message}`,
          locations: [],
        },
      ],
    };
  }

  submission.results = { findings };
  submission.status = hasErrors ? SubmissionStatus.FAILED : SubmissionStatus.PASSED;
  await submissionRepository.save(submission);

  try {
    await notificationService.send({
      event: NotificationEvent.SUBMISSION_PROCESSED,
      submissionId: submission.id,
      status: submission.status,
    });
  } catch (err) {
    console.error('Failed to send processed notification', err);
  }

  console.log(`Submission ${submissionId} processed successfully`);
}

// Simple status object for runtime diagnostics
export const workerStatus = {
  started: false,
  queueType: 'unknown' as 'unknown' | 'in-memory' | 'redis',
  lastError: null as string | null,
};

// Exported start function that will initialize DB and start listening for jobs.
export async function startWorker() {
  const hasRedisConfig = !!process.env.REDIS_HOST || !!process.env.REDIS_URL || !!process.env.REDIS_PORT;
  const forceInMemory = process.env.USE_IN_MEMORY_QUEUE === '1';
  const shouldUseInMemory = forceInMemory || !hasRedisConfig;

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Data Source has been initialized for worker!');
    } else {
      console.log('AppDataSource already initialized; worker will reuse existing connection');
    }

    if (shouldUseInMemory) {
      subscribeInMemorySubmissionProcessor(async (job) => {
        const submissionId = job.data.submissionId;
        await processSubmission(submissionId);
      });
      workerStatus.queueType = 'in-memory';
      workerStatus.started = true;
      console.log('Using in-memory submission queue. Worker ready.');
      // If this module is being run directly (standalone worker), keep the
      // process alive so it can continue handling submitted jobs.
      if (require.main === module) {
        console.log('Worker running standalone — keeping process alive.');
        // Keep event loop alive
        process.stdin.resume();
      }
      return;
    }

    // Only configure a Redis connection if explicit config is present
    let worker: Worker | undefined;
    if (process.env.REDIS_URL) {
      worker = new Worker(
        'submission-analysis',
        async (job: Job) => {
          const submissionId = job.data.submissionId;
          await processSubmission(submissionId);
        },
        { connection: { url: process.env.REDIS_URL } }
      );
      workerStatus.queueType = 'redis';
    } else if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
      worker = new Worker(
        'submission-analysis',
        async (job: Job) => {
          const submissionId = job.data.submissionId;
          await processSubmission(submissionId);
        },
        { connection: { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT, 10) } }
      );
      workerStatus.queueType = 'redis';
    } else {
      // Should not reach here because shouldUseInMemory covers missing configs,
      // but guard defensively.
      console.warn('No Redis configuration found; in-memory queue should have been used.');
      return;
    }

    worker.on('completed', (job: Job | undefined) => {
      if (!job) return;
      console.log(`${job.id} has completed!`);
    });

    worker.on('failed', (job: Job | undefined, err: Error | undefined) => {
      if (!job?.id) return;
      console.error(`${job.id} has failed with ${err?.message}`);
      try {
        const submissionId = job?.data?.submissionId;
        if (submissionId) {
          notificationService
            .send({
              event: NotificationEvent.SUBMISSION_FAILED,
              submissionId,
              status: 'failed',
            })
            .catch((e) => console.error('Failed to send failed notification', e));
        }
      } catch (e) {
        console.error('Failed handling failed event', e);
      }
    });

    // mark started if worker created successfully
    workerStatus.started = true;

    console.log('Worker started and is now listening for jobs...');
  } catch (err) {
    console.error('Error during Data Source initialization for worker:', err);
    throw err;
  }
}

// Backwards compatibility: run when invoked directly or via RUN_WORKER=1
const shouldRunWorkerDirectly = require.main === module || process.env.RUN_WORKER === '1';
if (shouldRunWorkerDirectly) {
  startWorker().catch((err) => console.error('Worker failed to start:', err));
}
