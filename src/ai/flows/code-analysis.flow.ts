import ai, { gemini15Pro, AI_CONFIG } from '../config/genkit.config';
import { z } from 'zod';
import {
  generateCodeReviewPrompt,
  generateSubmissionSummaryPrompt,
  generateFixSuggestionPrompt,
} from '../prompts/code-review.prompt';
import { AIAnalysisResultSchema } from '../types/ai.types';

// Define input/output types
type AnalyzeCodeInput = {
  files: Array<{
    path: string;
    content: string;
    size?: number;
  }>;
  projectContext?: {
    name: string;
    description?: string;
    language?: string;
    framework?: string;
  };
  existingRules?: Array<{
    type: string;
    message: string;
    severity: string;
  }>;
  focusAreas?: string[];
};

type AnalyzeCodeOutput = z.infer<typeof AIAnalysisResultSchema>;

type GenerateSummaryInput = {
  files: Array<{
    path: string;
    content: string;
  }>;
  analysisResults?: {
    issues: any[];
    strengths: string[];
  };
};

type GenerateSummaryOutput = {
  summary: string;
  keyChanges: string[];
  riskLevel: 'low' | 'medium' | 'high';
  reviewPriority: 'low' | 'medium' | 'high' | 'urgent';
};

type SuggestFixInput = {
  issue: {
    message: string;
    severity: string;
    file?: string;
    codeSnippet?: string;
  };
  fileContent?: string;
  language?: string;
};

type SuggestFixOutput = {
  fixDescription: string;
  codeExample?: string;
  explanation: string;
  alternativeApproaches?: string[];
};

/**
 * Main flow for analyzing code submissions
 * This is the primary AI analysis that runs on each submission
 */
export const analyzeCodeFlow = ai.defineFlow(
  {
    name: 'analyzeCode',
  },
  async (input: AnalyzeCodeInput): Promise<AnalyzeCodeOutput> => {
    const startTime = Date.now();

    try {
      // Generate the prompt
      const prompt = generateCodeReviewPrompt(input);

      // Call Gemini with the generated prompt
      const { text } = await ai.generate({
        model: gemini15Pro,
        prompt,
        config: {
          temperature: AI_CONFIG.temperature,
          maxOutputTokens: AI_CONFIG.maxTokens,
        },
      });

      // Parse the response
      let analysisResult;
      try {
        // Look for JSON in code blocks or raw JSON
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                         text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          analysisResult = JSON.parse(jsonStr);
        } else {
          // Fallback: create structured response from text
          analysisResult = parseUnstructuredAnalysis(text);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        analysisResult = parseUnstructuredAnalysis(text);
      }

      // Validate against schema
      const validatedResult = AIAnalysisResultSchema.parse(analysisResult);

      const processingTime = Date.now() - startTime;
      console.log(`AI analysis completed in ${processingTime}ms`);

      return validatedResult;
    } catch (error) {
      console.error('Error in analyzeCodeFlow:', error);
      
      // Return a fallback result
      return {
        summary: 'AI analysis encountered an error. Please review manually.',
        overallQuality: 'fair' as const,
        confidence: 0.3,
        issues: [],
        strengths: [],
        recommendations: ['Manual review recommended due to AI analysis error'],
      };
    }
  }
);

/**
 * Flow for generating submission summaries
 * Creates quick summaries for reviewers
 */
export const generateSummaryFlow = ai.defineFlow(
  {
    name: 'generateSummary',
  },
  async (input: GenerateSummaryInput): Promise<GenerateSummaryOutput> => {
    try {
      const prompt = generateSubmissionSummaryPrompt(input);

      const { text } = await ai.generate({
        model: gemini15Pro,
        prompt,
        config: {
          temperature: 0.5,
          maxOutputTokens: 500,
        },
      });

      // Parse response
      let summaryResult;
      try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                         text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          summaryResult = JSON.parse(jsonStr);
        } else {
          summaryResult = parseUnstructuredSummary(text, input.files.length);
        }
      } catch (parseError) {
        summaryResult = parseUnstructuredSummary(text, input.files.length);
      }

      return summaryResult;
    } catch (error) {
      console.error('Error in generateSummaryFlow:', error);
      
      return {
        summary: `Code submission with ${input.files.length} file(s). Manual review required.`,
        keyChanges: input.files.map((f) => f.path),
        riskLevel: 'medium' as const,
        reviewPriority: 'medium' as const,
      };
    }
  }
);

/**
 * Flow for suggesting fixes for specific issues
 */
export const suggestFixFlow = ai.defineFlow(
  {
    name: 'suggestFix',
  },
  async (input: SuggestFixInput): Promise<SuggestFixOutput> => {
    try {
      const prompt = generateFixSuggestionPrompt(input);

      const { text } = await ai.generate({
        model: gemini15Pro,
        prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      });

      // Parse response
      let fixResult;
      try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                         text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          fixResult = JSON.parse(jsonStr);
        } else {
          fixResult = parseUnstructuredFix(text);
        }
      } catch (parseError) {
        fixResult = parseUnstructuredFix(text);
      }

      return fixResult;
    } catch (error) {
      console.error('Error in suggestFixFlow:', error);
      
      return {
        fixDescription: 'Unable to generate fix suggestion at this time.',
        explanation: 'Please review the issue manually and apply appropriate fixes.',
      };
    }
  }
);

/**
 * Helper function to parse unstructured AI analysis text
 */
function parseUnstructuredAnalysis(text: string): any {
  // Extract key information from unstructured text
  const issues: any[] = [];
  const strengths: string[] = [];
  const recommendations: string[] = [];

  // Simple pattern matching for common structures
  const issueMatches = text.match(/(?:issue|problem|error|warning)[:\s]+(.*?)(?:\n|$)/gi);
  if (issueMatches) {
    issueMatches.forEach(match => {
      issues.push({
        severity: 'medium',
        category: 'general',
        message: match.trim(),
        explanation: 'Detected from AI analysis',
      });
    });
  }

  const strengthMatches = text.match(/(?:strength|good|positive)[:\s]+(.*?)(?:\n|$)/gi);
  if (strengthMatches) {
    strengthMatches.forEach(match => strengths.push(match.trim()));
  }

  // Determine quality based on issues count
  let overallQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
  if (issues.length === 0) overallQuality = 'excellent';
  else if (issues.length > 5) overallQuality = 'fair';
  else if (issues.length > 10) overallQuality = 'poor';

  return {
    summary: text.substring(0, 500),
    overallQuality,
    confidence: 0.6,
    issues,
    strengths: strengths.length > 0 ? strengths : ['Code structure appears reasonable'],
    recommendations: ['Review the analysis details for specific improvements'],
  };
}

/**
 * Helper function to parse unstructured summary text
 */
function parseUnstructuredSummary(text: string, fileCount: number): any {
  return {
    summary: text.substring(0, 300),
    keyChanges: [`${fileCount} file(s) modified`],
    riskLevel: fileCount > 5 ? 'high' : fileCount > 2 ? 'medium' : 'low',
    reviewPriority: 'medium',
  };
}

/**
 * Helper function to parse unstructured fix text
 */
function parseUnstructuredFix(text: string): any {
  const codeMatch = text.match(/```[\w]*\n([\s\S]*?)\n```/);
  
  return {
    fixDescription: text.substring(0, 200),
    codeExample: codeMatch ? codeMatch[1] : undefined,
    explanation: text,
    alternativeApproaches: [],
  };
}

/**
 * Convenience function to run code analysis
 */
export async function runCodeAnalysis(input: AnalyzeCodeInput) {
  return await analyzeCodeFlow(input);
}

/**
 * Convenience function to generate summary
 */
export async function runSummaryGeneration(input: GenerateSummaryInput) {
  return await generateSummaryFlow(input);
}

/**
 * Convenience function to suggest fix
 */
export async function runFixSuggestion(input: SuggestFixInput) {
  return await suggestFixFlow(input);
}
