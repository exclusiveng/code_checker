"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiReportingService = exports.AIReportingService = void 0;
const data_source_1 = require("../../config/data-source");
const submission_entity_1 = require("../../entities/submission.entity");
const reporting_flow_1 = require("../flows/reporting.flow");
const errors_1 = require("../../utils/errors");
class AIReportingService {
    /** Generate a detailed AI report for a single submission */
    async generateSubmissionReport(submissionId) {
        const submissionRepo = data_source_1.AppDataSource.getRepository(submission_entity_1.Submission);
        const submission = await submissionRepo.findOne({ where: { id: submissionId } });
        if (!submission) {
            throw new errors_1.AppError('Submission not found', 404);
        }
        const input = {
            submission: {
                id: submission.id,
                status: submission.status,
                createdAt: submission.createdAt,
                results: submission.results,
            },
            // In a real app you could fetch project metadata here
            projectContext: {
                name: submission.project?.name || 'Unknown',
                language: 'typescript', // placeholder – could be derived from project settings
            },
        };
        return await (0, reporting_flow_1.generateSubmissionReportFlow)(input);
    }
    /** Generate project-wide insights based on recent submissions */
    async generateProjectInsights(projectId, limit = 20) {
        const submissionRepo = data_source_1.AppDataSource.getRepository(submission_entity_1.Submission);
        const submissions = await submissionRepo.find({
            where: { project: { id: projectId } },
            order: { createdAt: 'DESC' },
            take: limit,
        });
        if (!submissions.length) {
            throw new errors_1.AppError('No submissions found for this project', 404);
        }
        const input = {
            submissions: submissions.map(s => ({
                id: s.id,
                status: s.status,
                createdAt: s.createdAt,
                results: s.results,
            })),
            projectContext: {
                name: submissions[0].project?.name || 'Unknown',
                language: 'typescript',
            },
        };
        return await (0, reporting_flow_1.generateProjectInsightsFlow)(input);
    }
}
exports.AIReportingService = AIReportingService;
exports.aiReportingService = new AIReportingService();
