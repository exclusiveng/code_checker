import { AppDataSource } from '../config/data-source';
import { Submission, SubmissionStatus } from '../entities/submission.entity';
import { RuleFinding } from './rule-engine.service';
import { mailService } from './mail.service';

export enum NotificationEvent {
  SUBMISSION_CREATED = 'submission.created',
  SUBMISSION_QUEUED = 'submission.queued',
  SUBMISSION_PROCESSED = 'submission.processed',
  SUBMISSION_FAILED = 'submission.failed',
}

export interface NotificationPayload {
  event: NotificationEvent;
  submissionId: string;
  status: string;
}

class NotificationService {
  async send(payload: NotificationPayload): Promise<void> {
    console.log(
      `Dispatching notification: ${payload.event} for submission ${payload.submissionId} with status ${payload.status}`,
    );

    // If SMTP isn't configured, we can't send an email, so we stop here.
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP not configured. Skipping email notification.');
      return;
    }

    const submissionRepository = AppDataSource.getRepository(Submission);
    const submission = await submissionRepository.findOne({
      where: { id: payload.submissionId },
      relations: ['developer'], // Load the developer to get their email
    });

    if (!submission || !submission.developer) {
      console.error(
        `Could not send notification for submission ${payload.submissionId}: submission or developer not found.`,
      );
      return;
    }

    const { subject, text, html } = this.getEmailContent(submission);

    await mailService.sendMail({
      to: submission.developer.email,
      subject,
      text,
      html,
    });
  }

  private getEmailContent(submission: Submission): { subject: string; text: string; html: string; } {
    const { id: submissionId, status, results } = submission;

    if (status === SubmissionStatus.PASSED) {
      const subject = `✅ Submission Passed: ${submissionId}`;
      const text = `Hello,\n\nGreat news! Your code submission with ID ${submissionId} has passed the automated review.\n\n- The Code Checker Team`;
      const html = `<p>Hello,</p><p>Great news! Your code submission with ID <b>${submissionId}</b> has passed the automated review.</p><p>Regards,<br/>The Code Checker Team</p>`;
      return { subject, text, html };
    }

    if (status === SubmissionStatus.FAILED) {
      const subject = `❌ Submission Failed: ${submissionId}`;
      const findings: RuleFinding[] = results?.findings || [];
      const textBody = this.generateTextFindings(findings);
      const htmlBody = this.generateHtmlFindings(findings);

      const text = `Hello,\n\nYour code submission with ID ${submissionId} has failed the automated review. Here are the findings:\n\n${textBody}\n\nPlease address these issues and resubmit.\n\n- The Code Checker Team`;
      const html = `<p>Hello,</p><p>Your code submission with ID <b>${submissionId}</b> has failed the automated review. Here are the findings:</p>${htmlBody}<p>Please address these issues and resubmit.</p><p>Regards,<br/>The Code Checker Team</p>`;

      return { subject, text, html };
    }

    // Default for other statuses like 'pending', 'queued', etc.
    const subject = `Update on your submission ${submissionId}`;
    const text = `Hello,\n\nThere is an update on your submission ${submissionId}. Its status is now: ${status}.`;
    const html = `<p>Hello,</p><p>There is an update on your submission <b>${submissionId}</b>. Its status is now: <b>${status}</b>.</p>`;
    return { subject, text, html };
  }

  private generateTextFindings(findings: RuleFinding[]): string {
    if (!findings || findings.length === 0) {
      return 'No specific findings were reported.';
    }
    return findings.map(f =>
      `[${f.severity.toUpperCase()}] ${f.message}\n` +
      (f.locations[0] ? `  -> File: ${f.locations[0].file}${f.locations[0].line ? ` (Line: ${f.locations[0].line})` : ''}\n` : '')
    ).join('\n');
  }

  private generateHtmlFindings(findings: RuleFinding[]): string {
    if (!findings || findings.length === 0) {
      return '<p>No specific findings were reported.</p>';
    }
    return `
      <style>
        .findings-table { width: 100%; border-collapse: collapse; font-family: sans-serif; }
        .findings-table th, .findings-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .findings-table th { background-color: #f2f2f2; }
        .severity-error { color: #D8000C; background-color: #FFBABA; }
        .severity-warning { color: #9F6000; background-color: #FEEFB3; }
      </style>
      <table class="findings-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Message</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          ${findings.map(f => `
            <tr class="severity-${f.severity}">
              <td>${f.severity.toUpperCase()}</td>
              <td>${f.message}</td>
              <td>${f.locations[0] ? `${f.locations[0].file}${f.locations[0].line ? `:${f.locations[0].line}` : ''}` : 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

export const notificationService = new NotificationService();
