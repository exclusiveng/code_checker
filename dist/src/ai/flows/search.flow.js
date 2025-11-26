"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartSearchFlow = exports.submissionComparisonFlow = exports.codebaseQueryFlow = void 0;
exports.runCodebaseQuery = runCodebaseQuery;
exports.runSubmissionComparison = runSubmissionComparison;
exports.runSmartSearch = runSmartSearch;
const genkit_config_1 = require("../config/genkit.config");
const search_prompt_1 = require("../prompts/search.prompt");
/**
 * Flow: Answer natural language questions about the codebase
 */
exports.codebaseQueryFlow = genkit_config_1.ai.defineFlow({
    name: 'codebaseQuery',
}, async (input) => {
    try {
        const prompt = (0, search_prompt_1.generateCodebaseQueryPrompt)(input);
        const { text } = await genkit_config_1.ai.generate({
            model: genkit_config_1.gemini20Flash,
            prompt,
            config: { temperature: 0.3, maxOutputTokens: 4000 }, // Increased for detailed analysis
        });
        try {
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : null;
            if (!jsonStr)
                throw new Error('No JSON found');
            return JSON.parse(jsonStr);
        }
        catch (parseError) {
            console.error('Failed to parse codebase query:', parseError);
            return {
                answer: 'Unable to process the query. Please try rephrasing your question.',
                codeExamples: [],
                relatedFindings: [],
                confidence: 0,
            };
        }
    }
    catch (error) {
        console.error('Error in codebaseQueryFlow:', error);
        return {
            answer: 'An error occurred while processing your query.',
            codeExamples: [],
            relatedFindings: [],
            confidence: 0,
        };
    }
});
/**
 * Flow: Compare two submissions with AI analysis
 */
exports.submissionComparisonFlow = genkit_config_1.ai.defineFlow({
    name: 'submissionComparison',
}, async (input) => {
    try {
        const prompt = (0, search_prompt_1.generateSubmissionComparisonPrompt)(input);
        const { text } = await genkit_config_1.ai.generate({
            model: genkit_config_1.gemini20Flash,
            prompt,
            config: { temperature: 0.4, maxOutputTokens: 2500 },
        });
        try {
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : null;
            if (!jsonStr)
                throw new Error('No JSON found');
            return JSON.parse(jsonStr);
        }
        catch (parseError) {
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
    }
    catch (error) {
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
});
/**
 * Flow: Smart search with natural language
 */
exports.smartSearchFlow = genkit_config_1.ai.defineFlow({
    name: 'smartSearch',
}, async (input) => {
    try {
        const prompt = (0, search_prompt_1.generateSmartSearchPrompt)(input);
        const { text } = await genkit_config_1.ai.generate({
            model: genkit_config_1.gemini20Flash,
            prompt,
            config: { temperature: 0.3, maxOutputTokens: 1500 },
        });
        try {
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : null;
            if (!jsonStr)
                throw new Error('No JSON found');
            return JSON.parse(jsonStr);
        }
        catch (parseError) {
            console.error('Failed to parse search results:', parseError);
            return {
                interpretation: 'Unable to interpret search query',
                results: [],
            };
        }
    }
    catch (error) {
        console.error('Error in smartSearchFlow:', error);
        return {
            interpretation: 'Search error occurred',
            results: [],
        };
    }
});
/**
 * Convenience functions
 */
async function runCodebaseQuery(input) {
    return await (0, exports.codebaseQueryFlow)(input);
}
async function runSubmissionComparison(input) {
    return await (0, exports.submissionComparisonFlow)(input);
}
async function runSmartSearch(input) {
    return await (0, exports.smartSearchFlow)(input);
}
