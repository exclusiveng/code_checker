import { Worker } from 'bullmq';
import { AppDataSource } from './config/data-source';
import { Submission, SubmissionStatus } from './entities/submission.entity';
import { Project } from './entities/project.entity';
import { RuleSet } from './entities/ruleset.entity';
import { Rule, RuleSeverity } from './entities/rule.entity';
import { evaluateRulesAgainstZip, RuleFinding } from './services/rule-engine.service';
import * as dotenv from 'dotenv';
import { notificationService, NotificationEvent } from './services/notification.service';

dotenv.config();

// Only create the worker when this file is executed directly or when RUN_WORKER=1 is set.
const shouldRunWorker = require.main === module || process.env.RUN_WORKER === '1';

if (shouldRunWorker) {
  const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  };

  AppDataSource.initialize()
    .then(() => {
      console.log('Data Source has been initialized for worker!');

      const worker = new Worker('submission-analysis', async (job) => {
        const { submissionId } = job.data;
        console.log(`Processing submission ${submissionId}`);

        const submissionRepository = AppDataSource.getRepository(Submission);
        const projectRepository = AppDataSource.getRepository(Project);
        const rulesetRepository = AppDataSource.getRepository(RuleSet);
        const submission = await submissionRepository.findOne({ where: { id: submissionId } });

        if (!submission) {
          throw new Error('Submission not found');
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

        // If no rules are found, we should fail the submission.
        if (rules.length === 0) {
          console.warn(`No rules found for project ${submission.projectId}. Marking submission as failed.`);
          submission.status = SubmissionStatus.FAILED;
          submission.results = {
            findings: [{
              ruleId: 'system-error',
              severity: RuleSeverity.ERROR,
              message: 'No ruleset is configured for this project. Analysis could not be performed.',
              locations: [],
            }],
          };
          await submissionRepository.save(submission);
          return;
        }

        // Evaluate rules against the uploaded zip
        let findings: RuleFinding[], hasErrors: boolean;
        try {
          const evaluationResult = await evaluateRulesAgainstZip(submission.zipUrl, rules);
          findings = evaluationResult.findings;
          hasErrors = evaluationResult.hasErrors;
        } catch (evaluationError: any) {
          console.error(`Rule evaluation failed for submission ${submissionId}:`, evaluationError);
          findings = [];
          hasErrors = true;
          submission.results = { findings: [{ ruleId: 'rule-evaluation-error', severity: 'error' as RuleSeverity, message: `Rule evaluation failed: ${evaluationError.message}`, locations: [] }] };
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
      }, { connection });

      worker.on('completed', (job) => {
        if (!job) return;
        console.log(`${job.id} has completed!`);
      });

      worker.on('failed', (job, err) => {
        if (!job?.id) return;
        console.error(`${job.id} has failed with ${err?.message}`);
        try {
          const submissionId = job?.data?.submissionId;
          if (submissionId) {
            notificationService.send({
              event: NotificationEvent.SUBMISSION_FAILED,
              submissionId,
              status: 'failed',
            }).catch(e => console.error('Failed to send failed notification', e));
          }
        } catch (e) {
          console.error('Failed handling failed event', e);
        }
      });

      console.log('Worker started and is now listening for jobs...');
    })
    .catch((err) => {
      console.error('Error during Data Source initialization for worker:', err);
    });
} else {

}
