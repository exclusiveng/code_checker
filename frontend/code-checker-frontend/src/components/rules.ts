export type RuleType = 'filename-contains' | 'file-content-contains';

export type RuleSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface RuleInput {
  id?: string;
  type: RuleType;
  payload: string;
  severity: RuleSeverity;
  message: string;
}