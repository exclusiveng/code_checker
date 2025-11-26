import { AppDataSource } from '../../config/data-source';
import { Submission } from '../../entities/submission.entity';
import { generateSubmissionReportFlow, generateProjectInsightsFlow } from '../flows/reporting.flow';
import { SubmissionReportInput, ProjectInsightsInput } from '../prompts/reporting.prompt';
import { AppError } from '../../utils/errors';

export class AIReportingService {
  /** Generate a detailed AI report for a single submission */
  async generateSubmissionReport(submissionId: string) {
    const submissionRepo = AppDataSource.getRepository(Submission);
    const submission = await submissionRepo.findOne({ where: { id: submissionId } });
    if (!submission) {
      throw new AppError('Submission not found', 404);
    }

    const input: SubmissionReportInput = {
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

    return await generateSubmissionReportFlow(input);
  }

  /** Generate project-wide insights based on recent submissions */
  async generateProjectInsights(projectId: string, limit = 20) {
    const submissionRepo = AppDataSource.getRepository(Submission);
    const submissions = await submissionRepo.find({
      where: { project: { id: projectId } },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    if (!submissions.length) {
      throw new AppError('No submissions found for this project', 404);
    }

    const input: ProjectInsightsInput = {
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

    return await generateProjectInsightsFlow(input);
  }
}

export const aiReportingService = new AIReportingService();
