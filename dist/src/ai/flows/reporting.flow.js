"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateProjectInsightsFlow = exports.generateSubmissionReportFlow = void 0;
exports.runSubmissionReport = runSubmissionReport;
exports.runProjectInsights = runProjectInsights;
const genkit_config_1 = require("../config/genkit.config");
const reporting_prompt_1 = require("../prompts/reporting.prompt");
/**
 * Flow: Generate AI-powered report for a submission
 */
exports.generateSubmissionReportFlow = genkit_config_1.ai.defineFlow({
    name: 'generateSubmissionReport',
}, async (input) => {
    try {
        const prompt = (0, reporting_prompt_1.generateSubmissionReportPrompt)(input);
        const { text } = await genkit_config_1.ai.generate({
            model: genkit_config_1.gemini20Flash,
            prompt,
            config: { temperature: 0.4 },
        });
        // Parse JSON response
        try {
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : null;
            if (!jsonStr)
                throw new Error('No JSON found');
            return JSON.parse(jsonStr);
        }
        catch (parseError) {
            console.error('Failed to parse submission report:', parseError);
            // Fallback
            return {
                summary: 'Report generation failed',
                keyIssues: [],
                actionableAdvice: [],
                score: 0,
            };
        }
    }
    catch (error) {
        console.error('Error in generateSubmissionReportFlow:', error);
        return {
            summary: 'An error occurred during report generation',
            keyIssues: [],
            actionableAdvice: ['Please try again later'],
            score: 0,
        };
    }
});
/**
 * Flow: Generate project-wide AI insights
 */
exports.generateProjectInsightsFlow = genkit_config_1.ai.defineFlow({
    name: 'generateProjectInsights',
}, async (input) => {
    try {
        const prompt = (0, reporting_prompt_1.generateProjectInsightsPrompt)(input);
        const { text } = await genkit_config_1.ai.generate({
            model: genkit_config_1.gemini20Flash,
            prompt,
            config: { temperature: 0.4 },
        });
        // Parse JSON response
        try {
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : null;
            if (!jsonStr)
                throw new Error('No JSON found');
            return JSON.parse(jsonStr);
        }
        catch (parseError) {
            console.error('Failed to parse project insights:', parseError);
            // Fallback
            return {
                trendAnalysis: 'Insights generation failed',
                improvementStrategy: [],
                teamFocus: [],
                healthScore: 0,
            };
        }
    }
    catch (error) {
        console.error('Error in generateProjectInsightsFlow:', error);
        return {
            trendAnalysis: 'An error occurred during insights generation',
            improvementStrategy: [],
            teamFocus: [],
            healthScore: 0,
        };
    }
});
/**
 * Convenience functions
 */
async function runSubmissionReport(input) {
    return await (0, exports.generateSubmissionReportFlow)(input);
}
async function runProjectInsights(input) {
    return await (0, exports.generateProjectInsightsFlow)(input);
}
