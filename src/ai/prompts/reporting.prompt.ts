import { Submission } from '../../entities/submission.entity';

export interface SubmissionReportInput {
  submission: {
    id: string;
    status: string;
    createdAt: Date;
    results: any;
  };
  projectContext?: {
    name: string;
    description?: string;
    language?: string;
  };
}

export interface ProjectInsightsInput {
  submissions: {
    id: string;
    status: string;
    createdAt: Date;
    results: any;
  }[];
  projectContext: {
    name: string;
    description?: string;
    language?: string;
  };
}

export function generateSubmissionReportPrompt(input: SubmissionReportInput): string {
  const { submission, projectContext } = input;
  const findings = submission.results?.findings || [];
  
  const findingsSummary = findings.map((f: any) => 
    `- [${f.severity}] ${f.message} (File: ${f.locations?.[0]?.file || 'unknown'})`
  ).join('\n');

  return `You are a senior code reviewer and technical lead. Your task is to generate a concise, constructive, and actionable report for a recent code submission.

**Project Context:**
Project: ${projectContext?.name || 'Unknown'}
Language: ${projectContext?.language || 'Unknown'}

**Submission Details:**
Status: ${submission.status}
Date: ${submission.createdAt}

**Findings:**
${findingsSummary || 'No specific findings reported.'}

**Instructions:**
1. **Executive Summary**: Provide a 1-2 sentence overview of the submission quality.
2. **Key Issues**: Highlight the top 3 most critical issues (if any) and why they matter.
3. **Actionable Advice**: Give specific advice on how to fix the issues.
4. **Tone**: Constructive, professional, and encouraging.

**IMPORTANT**: Respond with a valid JSON object in this exact format:
{
  "summary": "Executive summary text...",
  "keyIssues": [
    { "title": "Issue Title", "description": "Why it matters", "severity": "critical|error|warning" }
  ],
  "actionableAdvice": [
    "Advice 1",
    "Advice 2"
  ],
  "score": 85 // 0-100 quality score based on findings
}
`;
}

export function generateProjectInsightsPrompt(input: ProjectInsightsInput): string {
  const { submissions, projectContext } = input;
  
  // Aggregate data for the prompt
  const total = submissions.length;
  const passed = submissions.filter(s => s.status === 'passed').length;
  const failed = submissions.filter(s => s.status === 'failed').length;
  
  // Extract common failures
  const allFindings = submissions.flatMap(s => s.results?.findings || []);
  const failureCounts: Record<string, number> = {};
  allFindings.forEach((f: any) => {
    const key = f.message; // Group by message or ruleId
    failureCounts[key] = (failureCounts[key] || 0) + 1;
  });
  
  const topFailures = Object.entries(failureCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([msg, count]) => `- ${msg} (occurred ${count} times)`)
    .join('\n');

  return `You are a technical lead analyzing the development trends for a project.

**Project Context:**
Project: ${projectContext.name}
Language: ${projectContext.language || 'Unknown'}

**Submission Statistics:**
Total Submissions: ${total}
Passed: ${passed}
Failed: ${failed}
Pass Rate: ${Math.round((passed / total) * 100)}%

**Top Recurring Issues:**
${topFailures || 'No significant recurring issues.'}

**Instructions:**
1. **Trend Analysis**: Analyze the project's health based on the pass rate and recurring issues.
2. **Improvement Strategy**: Suggest a strategy to improve the code quality and reduce the most common failures.
3. **Team Focus**: What should the team learn or focus on next?

**IMPORTANT**: Respond with a valid JSON object in this exact format:
{
  "trendAnalysis": "Analysis of project health...",
  "improvementStrategy": [
    { "title": "Strategy Title", "description": "Detailed strategy" }
  ],
  "teamFocus": [
    "Focus area 1",
    "Focus area 2"
  ],
  "healthScore": 90 // 0-100 overall project health score
}
`;
}
