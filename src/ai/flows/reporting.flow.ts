import { ai, gemini20Flash } from '../config/genkit.config';
import {
  generateSubmissionReportPrompt,
  generateProjectInsightsPrompt,
  SubmissionReportInput,
  ProjectInsightsInput,
} from '../prompts/reporting.prompt';

// Output types
export type SubmissionReport = {
  summary: string;
  keyIssues: Array<{
    title: string;
    description: string;
    severity?: 'critical' | 'error' | 'warning' | 'info';
  }>;
  actionableAdvice: string[];
  score: number;
};

export type ProjectInsights = {
  trendAnalysis: string;
  improvementStrategy: Array<{
    title: string;
    description: string;
  }>;
  teamFocus: string[];
  healthScore: number;
};

/**
 * Flow: Generate AI-powered report for a submission
 */
export const generateSubmissionReportFlow = ai.defineFlow(
  {
    name: 'generateSubmissionReport',
  },
  async (input: SubmissionReportInput): Promise<SubmissionReport> => {
    try {
      const prompt = generateSubmissionReportPrompt(input);
      const { text } = await ai.generate({
        model: gemini20Flash,
        prompt,
        config: { temperature: 0.4 },
      });
      
      // Parse JSON response
      try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : null;
        if (!jsonStr) throw new Error('No JSON found');
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse submission report:', parseError);
        // Fallback
        return {
          summary: 'Report generation failed',
          keyIssues: [],
          actionableAdvice: [],
          score: 0,
        };
      }
    } catch (error) {
      console.error('Error in generateSubmissionReportFlow:', error);
      return {
        summary: 'An error occurred during report generation',
        keyIssues: [],
        actionableAdvice: ['Please try again later'],
        score: 0,
      };
    }
  }
);

/**
 * Flow: Generate project-wide AI insights
 */
export const generateProjectInsightsFlow = ai.defineFlow(
  {
    name: 'generateProjectInsights',
  },
  async (input: ProjectInsightsInput): Promise<ProjectInsights> => {
    try {
      const prompt = generateProjectInsightsPrompt(input);
      const { text } = await ai.generate({
        model: gemini20Flash,
        prompt,
        config: { temperature: 0.4 },
      });
      
      // Parse JSON response
      try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : null;
        if (!jsonStr) throw new Error('No JSON found');
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse project insights:', parseError);
        // Fallback
        return {
          trendAnalysis: 'Insights generation failed',
          improvementStrategy: [],
          teamFocus: [],
          healthScore: 0,
        };
      }
    } catch (error) {
      console.error('Error in generateProjectInsightsFlow:', error);
      return {
        trendAnalysis: 'An error occurred during insights generation',
        improvementStrategy: [],
        teamFocus: [],
        healthScore: 0,
      };
    }
  }
);

/**
 * Convenience functions
 */
export async function runSubmissionReport(input: SubmissionReportInput) {
  return await generateSubmissionReportFlow(input);
}

export async function runProjectInsights(input: ProjectInsightsInput) {
  return await generateProjectInsightsFlow(input);
}

