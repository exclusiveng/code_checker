"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerStatus = void 0;
exports.startWorker = startWorker;
const bullmq_1 = require("bullmq");
const queue_1 = require("./config/queue");
const data_source_1 = require("./config/data-source");
const submission_entity_1 = require("./entities/submission.entity");
const project_entity_1 = require("./entities/project.entity");
const ruleset_entity_1 = require("./entities/ruleset.entity");
const rule_entity_1 = require("./entities/rule.entity");
const rule_engine_service_1 = require("./services/rule-engine.service");
const dotenv = __importStar(require("dotenv"));
const notification_service_1 = require("./services/notification.service");
dotenv.config();
// Global handlers to surface problems and avoid silent exits during dev.
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection in worker:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception in worker:', err);
});
async function processSubmission(submissionId) {
    console.log(`Processing submission ${submissionId}`);
    const submissionRepository = data_source_1.AppDataSource.getRepository(submission_entity_1.Submission);
    const projectRepository = data_source_1.AppDataSource.getRepository(project_entity_1.Project);
    const rulesetRepository = data_source_1.AppDataSource.getRepository(ruleset_entity_1.RuleSet);
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
    let rules = [];
    for (const ruleset of rulesets) {
        console.log(`Using ruleset "${ruleset.name}" (ID: ${ruleset.id}) for submission ${submissionId}`);
        rules.push(...(ruleset.rules || []));
    }
    // If no rules are found, fail the submission.
    if (rules.length === 0) {
        console.warn(`No rules found for project ${submission.projectId}. Marking submission as failed.`);
        submission.status = submission_entity_1.SubmissionStatus.FAILED;
        submission.results = {
            findings: [
                {
                    ruleId: 'system-error',
                    severity: rule_entity_1.RuleSeverity.ERROR,
                    message: 'No ruleset is configured for this project. Analysis could not be performed.',
                    locations: [],
                },
            ],
        };
        await submissionRepository.save(submission);
        return;
    }
    // Evaluate rules against the uploaded zip
    let findings = [];
    let hasErrors = false;
    try {
        const evaluationResult = await (0, rule_engine_service_1.evaluateRulesAgainstZip)(submission.zipUrl, rules);
        findings = evaluationResult.findings;
        hasErrors = evaluationResult.hasErrors;
    }
    catch (evaluationError) {
        console.error(`Rule evaluation failed for submission ${submissionId}:`, evaluationError);
        findings = [];
        hasErrors = true;
        submission.results = {
            findings: [
                {
                    ruleId: 'rule-evaluation-error',
                    severity: 'error',
                    message: `Rule evaluation failed: ${evaluationError.message}`,
                    locations: [],
                },
            ],
        };
    }
    submission.results = { findings };
    submission.status = hasErrors ? submission_entity_1.SubmissionStatus.FAILED : submission_entity_1.SubmissionStatus.PASSED;
    await submissionRepository.save(submission);
    try {
        await notification_service_1.notificationService.send({
            event: notification_service_1.NotificationEvent.SUBMISSION_PROCESSED,
            submissionId: submission.id,
            status: submission.status,
        });
    }
    catch (err) {
        console.error('Failed to send processed notification', err);
    }
    console.log(`Submission ${submissionId} processed successfully`);
}
// Simple status object for runtime diagnostics
exports.workerStatus = {
    started: false,
    queueType: 'unknown',
    lastError: null,
};
// Exported start function that will initialize DB and start listening for jobs.
async function startWorker() {
    const hasRedisConfig = !!process.env.REDIS_HOST || !!process.env.REDIS_URL || !!process.env.REDIS_PORT;
    const forceInMemory = process.env.USE_IN_MEMORY_QUEUE === '1';
    const shouldUseInMemory = forceInMemory || !hasRedisConfig;
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
            console.log('Data Source has been initialized for worker!');
        }
        else {
            console.log('AppDataSource already initialized; worker will reuse existing connection');
        }
        if (shouldUseInMemory) {
            (0, queue_1.subscribeInMemorySubmissionProcessor)(async (job) => {
                const submissionId = job.data.submissionId;
                await processSubmission(submissionId);
            });
            exports.workerStatus.queueType = 'in-memory';
            exports.workerStatus.started = true;
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
        let worker;
        if (process.env.REDIS_URL) {
            worker = new bullmq_1.Worker('submission-analysis', async (job) => {
                const submissionId = job.data.submissionId;
                await processSubmission(submissionId);
            }, { connection: { url: process.env.REDIS_URL } });
            exports.workerStatus.queueType = 'redis';
        }
        else if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
            worker = new bullmq_1.Worker('submission-analysis', async (job) => {
                const submissionId = job.data.submissionId;
                await processSubmission(submissionId);
            }, { connection: { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT, 10) } });
            exports.workerStatus.queueType = 'redis';
        }
        else {
            // Should not reach here because shouldUseInMemory covers missing configs,
            // but guard defensively.
            console.warn('No Redis configuration found; in-memory queue should have been used.');
            return;
        }
        worker.on('completed', (job) => {
            if (!job)
                return;
            console.log(`${job.id} has completed!`);
        });
        worker.on('failed', (job, err) => {
            if (!job?.id)
                return;
            console.error(`${job.id} has failed with ${err?.message}`);
            try {
                const submissionId = job?.data?.submissionId;
                if (submissionId) {
                    notification_service_1.notificationService
                        .send({
                        event: notification_service_1.NotificationEvent.SUBMISSION_FAILED,
                        submissionId,
                        status: 'failed',
                    })
                        .catch((e) => console.error('Failed to send failed notification', e));
                }
            }
            catch (e) {
                console.error('Failed handling failed event', e);
            }
        });
        // mark started if worker created successfully
        exports.workerStatus.started = true;
        console.log('Worker started and is now listening for jobs...');
    }
    catch (err) {
        console.error('Error during Data Source initialization for worker:', err);
        throw err;
    }
}
// Backwards compatibility: run when invoked directly or via RUN_WORKER=1
const shouldRunWorkerDirectly = require.main === module || process.env.RUN_WORKER === '1';
if (shouldRunWorkerDirectly) {
    startWorker().catch((err) => console.error('Worker failed to start:', err));
}
