/**
 * AI Prompts for Ruleset Generation
 * Converts natural language requirements into structured validation rules
 */

interface RulesetGenerationInput {
  prompt: string;
  projectContext?: {
    name: string;
    language?: string;
    framework?: string;
    description?: string;
  };
  existingRules?: Array<{
    type: string;
    message: string;
    severity: string;
  }>;
  strictness?: 'strict' | 'moderate' | 'lenient';
}

interface RuleSuggestionInput {
  submissionHistory: Array<{
    id: string;
    issues: Array<{
      category: string;
      severity: string;
      message: string;
      frequency: number;
    }>;
  }>;
  projectContext?: {
    name: string;
    language?: string;
  };
}

/**
 * Generate ruleset from natural language prompt
 */
export function generateRulesetPrompt(input: RulesetGenerationInput): string {
  const { prompt, projectContext, existingRules, strictness = 'moderate' } = input;

  const contextInfo = projectContext ? `
**Project Context:**
- Name: ${projectContext.name}
${projectContext.language ? `- Language: ${projectContext.language}` : ''}
${projectContext.framework ? `- Framework: ${projectContext.framework}` : ''}
${projectContext.description ? `- Description: ${projectContext.description}` : ''}
` : '';

  const existingRulesInfo = existingRules && existingRules.length > 0 ? `
**Existing Rules (for reference):**
${existingRules.map(r => `- [${r.severity}] ${r.message}`).join('\n')}
` : '';

  const strictnessGuide = {
    strict: 'Be very strict. Enforce best practices rigorously. Use "error" severity for most rules.',
    moderate: 'Balance between strictness and flexibility. Use "warning" for style issues, "error" for bugs.',
    lenient: 'Be flexible. Focus on critical issues only. Use "warning" for most rules, "error" for severe bugs.',
  };

  return `You are an expert in software quality and code validation. Your task is to generate a comprehensive ruleset based on the user's requirements.

**User Requirements:**
${prompt}
${contextInfo}
${existingRulesInfo}

**Strictness Level:** ${strictness}
${strictnessGuide[strictness]}

**Rule Types Available (STRICTLY enforce these types):**

1. **filepattern**: Check for required or forbidden files/directories.
   - payload: { "pattern": "src/**/*.ts", "exists": true } 
   - OR: { "pattern": "*.log", "exists": false }

2. **content**: Check file content using Regex.
   - payload: { "pattern": "console\\.log", "flags": "g", "shouldMatch": false }
   - OR: { "pattern": "^import .* from 'react';", "flags": "m", "shouldMatch": true }

3. **eslint**: Enable standard ESLint rules.
   - payload: { "ruleId": "no-console", "options": ["error"] }
   - OR: { "ruleId": "eqeqeq", "options": ["always"] }

**Severity Levels:**
- **error**: Critical issues (blocks submission)
- **warning**: Important issues
- **info**: Suggestions

**IMPORTANT**: Respond with a valid JSON object in this exact format:
{
  "name": "Descriptive ruleset name",
  "description": "Clear description",
  "rules": [
    {
      "type": "filepattern|content|eslint",
      "payload": { /* type-specific payload from above */ },
      "severity": "error|warning|info",
      "message": "Clear message for the developer",
      "explanation": "Why this rule is important"
    }
  ],
  "rationale": "Why this ruleset is configured this way",
  "suggestedSeverity": "strict|moderate|lenient"
}

Generate a comprehensive, practical ruleset that addresses the user's requirements.`;
}

/**
 * Suggest rules based on submission history
 */
export function generateRuleSuggestionsPrompt(input: RuleSuggestionInput): string {
  const { submissionHistory, projectContext } = input;

  // Aggregate common issues
  const issueFrequency: Record<string, { count: number; severity: string; examples: string[] }> = {};
  
  submissionHistory.forEach(submission => {
    submission.issues.forEach(issue => {
      const key = `${issue.category}:${issue.message}`;
      if (!issueFrequency[key]) {
        issueFrequency[key] = {
          count: 0,
          severity: issue.severity,
          examples: [],
        };
      }
      issueFrequency[key].count += issue.frequency || 1;
      if (issueFrequency[key].examples.length < 3) {
        issueFrequency[key].examples.push(issue.message);
      }
    });
  });

  const topIssues = Object.entries(issueFrequency)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([key, data]) => ({
      issue: key.split(':')[1],
      category: key.split(':')[0],
      frequency: data.count,
      severity: data.severity,
    }));

  const issuesList = topIssues.map((issue, idx) => 
    `${idx + 1}. [${issue.category}] ${issue.issue} (occurred ${issue.frequency} times)`
  ).join('\n');

  return `You are analyzing submission history to suggest new validation rules that would catch common issues.

**Project:** ${projectContext?.name || 'Unknown'}
${projectContext?.language ? `**Language:** ${projectContext.language}` : ''}

**Most Common Issues in Past Submissions:**
${issuesList}

**Your Task:**
Analyze these recurring issues and suggest validation rules that would catch them automatically. Focus on:
1. Issues that appear frequently
2. Issues that can be detected with automated rules
3. Rules that would improve code quality

**IMPORTANT**: Respond with a valid JSON object in this exact format:
{
  "suggestedRules": [
    {
      "type": "filepattern|content|structure|dependency",
      "payload": { /* type-specific payload */ },
      "severity": "error|warning|info",
      "message": "Clear message explaining what this rule checks",
      "explanation": "Why this rule would help based on submission history",
      "addressedIssues": ["List of issues this rule would catch"]
    }
  ],
  "summary": "Brief summary of the suggested improvements",
  "estimatedImpact": "How much these rules would reduce common issues (percentage)"
}

Generate practical, actionable rules that address the most common problems.`;
}

/**
 * Improve existing ruleset
 */
export function generateRulesetImprovementPrompt(params: {
  currentRuleset: {
    name: string;
    rules: any[];
  };
  feedback: string;
  submissionStats?: {
    totalSubmissions: number;
    passedSubmissions: number;
    failedSubmissions: number;
    commonFailures: string[];
  };
}): string {
  const { currentRuleset, feedback, submissionStats } = params;

  const statsInfo = submissionStats ? `
**Submission Statistics:**
- Total: ${submissionStats.totalSubmissions}
- Passed: ${submissionStats.passedSubmissions}
- Failed: ${submissionStats.failedSubmissions}
- Pass Rate: ${((submissionStats.passedSubmissions / submissionStats.totalSubmissions) * 100).toFixed(1)}%

**Common Failure Reasons:**
${submissionStats.commonFailures.map((f, i) => `${i + 1}. ${f}`).join('\n')}
` : '';

  return `You are improving an existing ruleset based on user feedback and usage statistics.

**Current Ruleset:** ${currentRuleset.name}
**Number of Rules:** ${currentRuleset.rules.length}
${statsInfo}

**User Feedback:**
${feedback}

**Current Rules:**
${currentRuleset.rules.map((r, i) => `${i + 1}. [${r.severity}] ${r.message}`).join('\n')}

**Your Task:**
Improve the ruleset based on the feedback and statistics. You can:
1. Add new rules to address gaps
2. Modify existing rules to be more/less strict
3. Remove rules that are too restrictive or not useful
4. Change severity levels

**IMPORTANT**: Respond with a valid JSON object in this exact format:
{
  "name": "Updated ruleset name",
  "description": "Updated description",
  "rules": [
    {
      "type": "filepattern|content|structure|dependency",
      "payload": { /* type-specific payload */ },
      "severity": "error|warning|info",
      "message": "Clear message",
      "explanation": "Why this rule exists"
    }
  ],
  "changes": [
    "List of changes made (e.g., 'Added rule for X', 'Relaxed severity of Y')"
  ],
  "rationale": "Why these changes improve the ruleset"
}

Provide an improved ruleset that addresses the feedback while maintaining quality standards.`;
}
