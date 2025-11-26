/**
 * AI Prompts for Code Review
 * These are template functions that generate prompts for the AI model
 */

interface CodeFile {
  path: string;
  content: string;
  size?: number;
}

interface ProjectContext {
  name: string;
  description?: string;
  language?: string;
  framework?: string;
}

interface ExistingRule {
  type: string;
  message: string;
  severity: string;
}

/**
 * Generate a code review prompt
 */
export function generateCodeReviewPrompt(params: {
  files: CodeFile[];
  projectContext?: ProjectContext;
  existingRules?: ExistingRule[];
  focusAreas?: string[];
}): string {
  const { files, projectContext, existingRules, focusAreas } = params;
  
  const filesList = files.map((f, idx) => 
    `### File ${idx + 1}: ${f.path}\n\`\`\`\n${f.content.substring(0, 5000)}\n\`\`\`\n`
  ).join('\n\n');

  const rulesContext = existingRules && existingRules.length > 0
    ? `\n\n**Existing Project Rules:**\n${existingRules.map(r => `- [${r.severity}] ${r.message}`).join('\n')}`
    : '';

  const focusContext = focusAreas && focusAreas.length > 0
    ? `\n\n**Focus Areas:** ${focusAreas.join(', ')}`
    : '';

  return `You are an expert code reviewer with deep knowledge of software engineering best practices, security, performance, and maintainability. Your task is to analyze code submissions and provide actionable, constructive feedback.

**Analysis Guidelines:**
1. Identify critical issues that could cause bugs, security vulnerabilities, or performance problems
2. Highlight code quality issues (readability, maintainability, design patterns)
3. Note positive aspects and strengths in the code
4. Provide specific, actionable recommendations
5. Consider the project context and existing rules
6. Be constructive and educational in your feedback
7. Assign appropriate severity levels based on impact

**Severity Levels:**
- **critical**: Security vulnerabilities, data loss risks, breaking changes
- **high**: Bugs, significant performance issues, major design flaws
- **medium**: Code quality issues, minor bugs, maintainability concerns
- **low**: Style inconsistencies, minor optimizations
- **info**: Suggestions, best practices, educational notes

Please analyze the following code submission:

${projectContext ? `**Project:** ${projectContext.name}
${projectContext.description ? `**Description:** ${projectContext.description}` : ''}
${projectContext.language ? `**Language:** ${projectContext.language}` : ''}
${projectContext.framework ? `**Framework:** ${projectContext.framework}` : ''}` : ''}
${rulesContext}
${focusContext}

**Files to Review:**
${filesList}

**IMPORTANT**: Respond with a valid JSON object in this exact format:
{
  "summary": "Brief 2-3 sentence summary of the code",
  "overallQuality": "excellent|good|fair|poor",
  "confidence": 0.85,
  "issues": [
    {
      "severity": "critical|high|medium|low|info",
      "category": "security|performance|maintainability|style|etc",
      "message": "Brief issue description",
      "explanation": "Detailed explanation of the issue",
      "location": {
        "file": "path/to/file.ts",
        "line": 42
      },
      "suggestedFix": "How to fix this issue",
      "codeSnippet": "Relevant code snippet"
    }
  ],
  "strengths": ["List of positive aspects"],
  "recommendations": ["List of actionable recommendations"],
  "estimatedReviewTime": "15-30 minutes"
}`;
}

/**
 * Generate a submission summary prompt
 */
export function generateSubmissionSummaryPrompt(params: {
  files: CodeFile[];
  analysisResults?: {
    issues: any[];
    strengths: string[];
  };
}): string {
  const { files, analysisResults } = params;
  
  const filesList = files.map(f => `- ${f.path}`).join('\n');
  const issuesContext = analysisResults?.issues 
    ? `\n**Issues Found:** ${analysisResults.issues.length} issues detected`
    : '';

  return `You are a technical lead reviewing code submissions. Create concise, actionable summaries that help reviewers quickly understand what changed and what needs attention.

**Summary Guidelines:**
1. Highlight the main purpose of the submission
2. List key changes and additions
3. Assess risk level based on scope and complexity
4. Determine review priority
5. Keep it concise (3-5 sentences max)

Summarize this code submission:

**Files Changed:**
${filesList}
${issuesContext}

**IMPORTANT**: Respond with a valid JSON object in this exact format:
{
  "summary": "Brief summary of changes",
  "keyChanges": ["Change 1", "Change 2", "Change 3"],
  "riskLevel": "low|medium|high",
  "reviewPriority": "low|medium|high|urgent"
}`;
}

/**
 * Generate a fix suggestion prompt
 */
export function generateFixSuggestionPrompt(params: {
  issue: {
    message: string;
    severity: string;
    file?: string;
    codeSnippet?: string;
  };
  fileContent?: string;
  language?: string;
}): string {
  const { issue, fileContent, language } = params;

  return `You are a senior software engineer providing specific, actionable fix suggestions. Your fixes should be:
1. Correct and production-ready
2. Well-explained with reasoning
3. Following best practices
4. Considering edge cases
5. Including code examples when helpful

Suggest a fix for this issue:

**Issue:** ${issue.message}
**Severity:** ${issue.severity}
${issue.file ? `**File:** ${issue.file}` : ''}
${language ? `**Language:** ${language}` : ''}

${issue.codeSnippet ? `**Current Code:**\n\`\`\`\n${issue.codeSnippet}\n\`\`\`` : ''}

${fileContent ? `**Full File Context:**\n\`\`\`\n${fileContent.substring(0, 2000)}\n\`\`\`` : ''}

**IMPORTANT**: Respond with a valid JSON object in this exact format:
{
  "fixDescription": "Brief description of the fix",
  "codeExample": "Fixed code example",
  "explanation": "Detailed explanation of why this fix works",
  "alternativeApproaches": ["Alternative approach 1", "Alternative approach 2"]
}`;
}
