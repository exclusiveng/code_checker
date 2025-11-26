import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Configure Genkit with Google AI (Gemini)
 * This is the central configuration for all AI features
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: gemini20Flash, // Using Gemini 2.0 Flash - latest model
});

/**
 * AI Configuration Constants
 */
export const AI_CONFIG = {
  model: process.env.AI_MODEL || 'gemini-2.0-flash',
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2048'),
  
  // Feature flags
  features: {
    analysis: process.env.ENABLE_AI_ANALYSIS === 'true',
    rulesetGeneration: process.env.ENABLE_AI_RULESET_GENERATION === 'true',
    search: process.env.ENABLE_AI_SEARCH === 'true',
    documentation: process.env.ENABLE_AI_DOCS === 'true',
  },
  
  // Cost control
  maxRequestsPerMinute: parseInt(process.env.AI_MAX_REQUESTS_PER_MIN || '60'),
  maxTokensPerRequest: parseInt(process.env.AI_MAX_TOKENS_PER_REQUEST || '8000'),
};

// Export the model for use in flows
export { gemini20Flash } from '@genkit-ai/googleai';
export const gemini15Pro = gemini20Flash; // Alias for compatibility
export default ai;

