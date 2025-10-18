/* -------------------------------------------------------
   Global Type Declarations for the Code Checker Frontend
   ------------------------------------------------------- */

export {};

declare global {
  /** Represents a user in the system */
  interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    companyId: string;
    createdAt: string;
  }

  /** User roles, matching backend enum */
  type UserRole = 'super_admin' | 'admin' | 'reviewer' | 'developer';

  /** Represents a company entity */
  interface Company {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
  }

  /** Represents a single rule definition */
  interface Rule {
    id: string;
    type: RuleType;
    payload: any;
    severity: RuleSeverity;
    message: string;
  }

  /** Rule Types (aligned with backend RuleType enum) */
  type RuleType = 'regex' | 'eslint' | 'ast' | 'filepattern' | 'content' | 'filename-contains' | 'file-content-contains';

  /** Rule severity (aligned with backend RuleSeverity enum) */
  type RuleSeverity = 'error' | 'warning';

  /** A full ruleset (for a company or project) */
  interface RuleSet {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    rules: Rule[];
    createdAt: string;
  }

  export interface RuleInput {
  id?: string;
  type: string;
  payload: any;
  severity: string;
  message: string;
}

  /** Represents an uploaded submission */
  interface Submission {
    id: string;
    projectId: string;
    developerId: string;
    filesMetadata?: any;
    zipUrl: string;
    status: SubmissionStatus;
    results?: RuleEvaluationResult;
    githubPushInfo?: any;
    createdAt: string;
  }

  /** Submission status enum */
  type SubmissionStatus = 'pending' | 'passed' | 'failed' | 'reviewed';

  /** Represents a project (linked to submissions) */
  interface Project {
    id: string;
    name: string;
    description?: string;
    defaultRuleSetId?: string;
    createdAt: string;
  }

  /** Result of a rule evaluation */
  interface RuleEvaluationResult {
    findings: RuleFinding[];
    hasErrors: boolean;
  }

  /** A single rule violation or warning */
  interface RuleFinding {
    ruleId: string;
    severity: RuleSeverity;
    message: string;
    locations: {
      file: string;
      line?: number;
      excerpt?: string;
    }[];
  }

  /** Notification event type */
  type NotificationEvent =
    | 'submission.created'
    | 'submission.queued'
    | 'submission.processed'
    | 'submission.failed';

  /** Notification payload shape */
  interface NotificationPayload {
    event: NotificationEvent;
    submissionId: string;
    status: string;
  }
}
