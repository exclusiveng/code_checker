import { ai, gemini20Flash } from '../config/genkit.config';
import {
  generateCodebaseQueryPrompt,
  generateSubmissionComparisonPrompt,
  generateSmartSearchPrompt,
  CodebaseQueryInput,
  SubmissionComparisonInput,
  SmartSearchInput,
} from '../prompts/search.prompt';

// Output types
export type CodebaseQueryResult = {
  answer: string;
  codeExamples: Array<{
    submissionId: string;
    snippet: string;
    explanation: string;
  }>;
  relatedFindings: string[];
  confidence: number;
};

export type SubmissionComparisonResult = {
  summary: string;
  keyDifferences: Array<{
    aspect: string;
    submission1: string;
    submission2: string;
    winner: 'submission1' | 'submission2' | 'tie';
  }>;
  overallWinner: 'submission1' | 'submission2' | 'tie';
  reasoning: string;
  recommendations: string[];
  scoreComparison: {
    submission1: number;
    submission2: number;
  };
};

export type SmartSearchResult = {
  interpretation: string;
  results: Array<{
    submissionId: string;
    relevanceScore: number;
    matchReason: string;
    highlights: string[];
  }>;
  suggestedFilters?: {
    status?: string[];
    dateRange?: string;
  };
};

/**
 * Flow: Answer natural language questions about the codebase
 */
export const codebaseQueryFlow = ai.defineFlow(
  {
    name: 'codebaseQuery',
  },
  async (input: CodebaseQueryInput): Promise<CodebaseQueryResult> => {
    try {
      const prompt = generateCodebaseQueryPrompt(input);
      const { text } = await ai.generate({
        model: gemini20Flash,
        prompt,
        config: { temperature: 0.3, maxOutputTokens: 4000 }, // Increased for detailed analysis
      });

      try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : null;
        if (!jsonStr) throw new Error('No JSON found');
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse codebase query:', parseError);
        return {
          answer: 'Unable to process the query. Please try rephrasing your question.',
          codeExamples: [],
          relatedFindings: [],
          confidence: 0,
        };
      }
    } catch (error) {
      console.error('Error in codebaseQueryFlow:', error);
      return {
        answer: 'An error occurred while processing your query.',
        codeExamples: [],
        relatedFindings: [],
        confidence: 0,
      };
    }
  }
);

/**
 * Flow: Compare two submissions with AI analysis
 */
export const submissionComparisonFlow = ai.defineFlow(
  {
    name: 'submissionComparison',
  },
  async (input: SubmissionComparisonInput): Promise<SubmissionComparisonResult> => {
    try {
      const prompt = generateSubmissionComparisonPrompt(input);
      const { text } = await ai.generate({
        model: gemini20Flash,
        prompt,
        config: { temperature: 0.4, maxOutputTokens: 2500 },
      });

      try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : null;
        if (!jsonStr) throw new Error('No JSON found');
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse comparison:', parseError);
        return {
          summary: 'Unable to compare submissions',
          keyDifferences: [],
          overallWinner: 'tie',
          reasoning: 'Comparison failed',
          recommendations: [],
          scoreComparison: { submission1: 0, submission2: 0 },
        };
      }
    } catch (error) {
      console.error('Error in submissionComparisonFlow:', error);
      return {
        summary: 'An error occurred during comparison',
        keyDifferences: [],
        overallWinner: 'tie',
        reasoning: 'Error occurred',
        recommendations: [],
        scoreComparison: { submission1: 0, submission2: 0 },
      };
    }
  }
);

/**
 * Flow: Smart search with natural language
 */
export const smartSearchFlow = ai.defineFlow(
  {
    name: 'smartSearch',
  },
  async (input: SmartSearchInput): Promise<SmartSearchResult> => {
    try {
      const prompt = generateSmartSearchPrompt(input);
      const { text } = await ai.generate({
        model: gemini20Flash,
        prompt,
        config: { temperature: 0.3, maxOutputTokens: 1500 },
      });

      try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : null;
        if (!jsonStr) throw new Error('No JSON found');
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse search results:', parseError);
        return {
          interpretation: 'Unable to interpret search query',
          results: [],
        };
      }
    } catch (error) {
      console.error('Error in smartSearchFlow:', error);
      return {
        interpretation: 'Search error occurred',
        results: [],
      };
    }
  }
);

/**
 * Convenience functions
 */
export async function runCodebaseQuery(input: CodebaseQueryInput) {
  return await codebaseQueryFlow(input);
}

export async function runSubmissionComparison(input: SubmissionComparisonInput) {
  return await submissionComparisonFlow(input);
}

export async function runSmartSearch(input: SmartSearchInput) {
  return await smartSearchFlow(input);
}
