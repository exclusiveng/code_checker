import ai, { gemini15Pro, AI_CONFIG } from '../config/genkit.config';
import {
  generateRulesetPrompt,
  generateRuleSuggestionsPrompt,
  generateRulesetImprovementPrompt,
} from '../prompts/ruleset-generation.prompt';
import { RulesetGenerationResultSchema } from '../types/ai.types';

/**
 * Input/Output types for ruleset generation flows
 */
type GenerateRulesetInput = {
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
};

type GenerateRulesetOutput = {
  name: string;
  description: string;
  rules: Array<{
    type: string;
    payload: Record<string, any>;
    severity: string;
    message: string;
    explanation: string;
  }>;
  rationale: string;
  suggestedSeverity: 'strict' | 'moderate' | 'lenient';
};

type SuggestRulesInput = {
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
};

type SuggestRulesOutput = {
  suggestedRules: Array<{
    type: string;
    payload: Record<string, any>;
    severity: string;
    message: string;
    explanation: string;
    addressedIssues: string[];
  }>;
  summary: string;
  estimatedImpact: string;
};

type ImproveRulesetInput = {
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
};

type ImproveRulesetOutput = {
  name: string;
  description: string;
  rules: Array<{
    type: string;
    payload: Record<string, any>;
    severity: string;
    message: string;
    explanation: string;
  }>;
  changes: string[];
  rationale: string;
};

/**
 * Flow: Generate ruleset from natural language prompt
 */
export const generateRulesetFlow = ai.defineFlow(
  {
    name: 'generateRuleset',
  },
  async (input: GenerateRulesetInput): Promise<GenerateRulesetOutput> => {
    const startTime = Date.now();

    try {
      console.log(`Generating ruleset from prompt: "${input.prompt.substring(0, 100)}..."`);

      const prompt = generateRulesetPrompt(input);

      const { text } = await ai.generate({
        model: gemini15Pro,
        prompt,
        config: {
          temperature: 0.5, // Lower temperature for more consistent rule generation
          maxOutputTokens: 3000,
        },
      });

      // Parse response
      let rulesetResult;
      try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          rulesetResult = JSON.parse(jsonStr);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse ruleset response:', parseError);
        // Fallback: create basic ruleset
        rulesetResult = {
          name: 'Generated Ruleset',
          description: input.prompt,
          rules: [],
          rationale: 'Failed to parse AI response',
          suggestedSeverity: input.strictness || 'moderate',
        };
      }

      // Validate rules structure
      if (rulesetResult.rules) {
        rulesetResult.rules = rulesetResult.rules.filter((rule: any) => 
          rule.type && rule.payload && rule.severity && rule.message
        );
      }

      const processingTime = Date.now() - startTime;
      console.log(`Ruleset generated in ${processingTime}ms with ${rulesetResult.rules?.length || 0} rules`);

      return rulesetResult;
    } catch (error) {
      console.error('Error in generateRulesetFlow:', error);
      
      return {
        name: 'Error Generating Ruleset',
        description: 'Failed to generate ruleset from prompt',
        rules: [],
        rationale: 'An error occurred during generation. Please try again with a more specific prompt.',
        suggestedSeverity: 'moderate',
      };
    }
  }
);

/**
 * Flow: Suggest rules based on submission history
 */
export const suggestRulesFlow = ai.defineFlow(
  {
    name: 'suggestRules',
  },
  async (input: SuggestRulesInput): Promise<SuggestRulesOutput> => {
    try {
      console.log(`Analyzing ${input.submissionHistory.length} submissions for rule suggestions`);

      const prompt = generateRuleSuggestionsPrompt(input);

      const { text } = await ai.generate({
        model: gemini15Pro,
        prompt,
        config: {
          temperature: 0.6,
          maxOutputTokens: 2000,
        },
      });

      // Parse response
      let suggestionsResult;
      try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          suggestionsResult = JSON.parse(jsonStr);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse suggestions response:', parseError);
        suggestionsResult = {
          suggestedRules: [],
          summary: 'Failed to generate suggestions',
          estimatedImpact: '0%',
        };
      }

      return suggestionsResult;
    } catch (error) {
      console.error('Error in suggestRulesFlow:', error);
      
      return {
        suggestedRules: [],
        summary: 'Error analyzing submission history',
        estimatedImpact: '0%',
      };
    }
  }
);

/**
 * Flow: Improve existing ruleset
 */
export const improveRulesetFlow = ai.defineFlow(
  {
    name: 'improveRuleset',
  },
  async (input: ImproveRulesetInput): Promise<ImproveRulesetOutput> => {
    try {
      console.log(`Improving ruleset: ${input.currentRuleset.name}`);

      const prompt = generateRulesetImprovementPrompt(input);

      const { text } = await ai.generate({
        model: gemini15Pro,
        prompt,
        config: {
          temperature: 0.5,
          maxOutputTokens: 3000,
        },
      });

      // Parse response
      let improvementResult;
      try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          improvementResult = JSON.parse(jsonStr);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse improvement response:', parseError);
        improvementResult = {
          ...input.currentRuleset,
          changes: ['Failed to generate improvements'],
          rationale: 'Error parsing AI response',
        };
      }

      return improvementResult;
    } catch (error) {
      console.error('Error in improveRulesetFlow:', error);
      
      return {
        ...input.currentRuleset,
        description: input.currentRuleset.name,
        changes: ['Error occurred during improvement'],
        rationale: 'Please try again',
      };
    }
  }
);

/**
 * Convenience functions
 */
export async function runRulesetGeneration(input: GenerateRulesetInput) {
  return await generateRulesetFlow(input);
}

export async function runRuleSuggestions(input: SuggestRulesInput) {
  return await suggestRulesFlow(input);
}

export async function runRulesetImprovement(input: ImproveRulesetInput) {
  return await improveRulesetFlow(input);
}
