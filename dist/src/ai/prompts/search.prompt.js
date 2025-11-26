"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCodebaseQueryPrompt = generateCodebaseQueryPrompt;
exports.generateSubmissionComparisonPrompt = generateSubmissionComparisonPrompt;
exports.generateSmartSearchPrompt = generateSmartSearchPrompt;
function generateCodebaseQueryPrompt(input) {
    const { query, submissions, context } = input;
    // Send full code for better analysis (AI can handle it)
    const codeSubmissions = submissions.map((sub, idx) => `=== Submission ${idx + 1} (ID: ${sub.id}) ===\n${sub.code}\n`).join('\n\n');
    return `You are an expert code analyst with deep knowledge of security, performance, and best practices. A user has asked a question about their codebase.

**User Question:**
"${query}"

**Project Context:**
${context?.projectName ? `Project: ${context.projectName}` : ''}
${context?.language ? `Language: ${context.language}` : ''}

**Code Submissions (${submissions.length} total):**
${codeSubmissions}

**Instructions:**
1. **Thoroughly analyze ALL the code** provided above
2. Look for patterns, vulnerabilities, and issues related to the question
3. For security questions, check for:
   - SQL injection vulnerabilities
   - XSS (Cross-Site Scripting) risks
   - Authentication/authorization flaws
   - Insecure data handling
   - Hard-coded secrets or credentials
   - Unsafe eval() or similar dangerous functions
4. Provide **specific code examples** with file names and line references when possible
5. Reference submission IDs when citing examples
6. Be thorough and detailed in your analysis
7. If you find issues, explain the risk and how to fix them

**IMPORTANT**: Respond with a valid JSON object in this exact format:
{
  "answer": "Comprehensive answer to the user's question with specific findings",
  "codeExamples": [
    {
      "submissionId": "submission-id",
      "snippet": "relevant code snippet showing the issue or pattern",
      "explanation": "detailed explanation of why this is relevant and what it means"
    }
  ],
  "relatedFindings": [
    "Additional insight 1",
    "Additional insight 2"
  ],
  "confidence": 0.95
}
`;
}
function generateSubmissionComparisonPrompt(input) {
    const { submission1, submission2, comparisonFocus } = input;
    const focus = comparisonFocus || 'all';
    const focusDescription = {
        quality: 'code quality, maintainability, and best practices',
        performance: 'performance, efficiency, and optimization',
        security: 'security vulnerabilities and safe coding practices',
        all: 'overall code quality, performance, and security'
    }[focus];
    return `You are a senior code reviewer comparing two code submissions.

**Submission 1:**
ID: ${submission1.id}
Date: ${submission1.createdAt}
Findings: ${JSON.stringify(submission1.results?.findings || [])}
Code Preview: ${submission1.code.substring(0, 800)}...

**Submission 2:**
ID: ${submission2.id}
Date: ${submission2.createdAt}
Findings: ${JSON.stringify(submission2.results?.findings || [])}
Code Preview: ${submission2.code.substring(0, 800)}...

**Comparison Focus:** ${focusDescription}

**Instructions:**
1. Compare the two submissions focusing on: ${focusDescription}
2. Identify key differences in approach, quality, and issues
3. Determine which submission is better and why
4. Provide specific recommendations for improvement

**IMPORTANT**: Respond with a valid JSON object in this exact format:
{
  "summary": "High-level comparison summary",
  "keyDifferences": [
    {
      "aspect": "Code structure",
      "submission1": "Description for submission 1",
      "submission2": "Description for submission 2",
      "winner": "submission1" | "submission2" | "tie"
    }
  ],
  "overallWinner": "submission1" | "submission2" | "tie",
  "reasoning": "Why one is better than the other",
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "scoreComparison": {
    "submission1": 85,
    "submission2": 78
  }
}
`;
}
function generateSmartSearchPrompt(input) {
    const { query, submissions } = input;
    const submissionSummaries = submissions.map(sub => `ID: ${sub.id}, Status: ${sub.metadata?.status}, Issues: ${sub.results?.findings?.length || 0}`).join('\n');
    return `You are a smart search assistant helping users find relevant code submissions.

**User Search Query:**
"${query}"

**Available Submissions:**
${submissionSummaries}

**Instructions:**
1. Interpret the user's natural language query
2. Identify which submissions are most relevant
3. Rank submissions by relevance
4. Explain why each submission matches the query

**IMPORTANT**: Respond with a valid JSON object in this exact format:
{
  "interpretation": "What the user is looking for",
  "results": [
    {
      "submissionId": "submission-id",
      "relevanceScore": 0.95,
      "matchReason": "Why this submission matches",
      "highlights": ["Key point 1", "Key point 2"]
    }
  ],
  "suggestedFilters": {
    "status": ["failed"],
    "dateRange": "last 7 days"
  }
}
`;
}
