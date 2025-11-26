"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestFixFlow = exports.generateSummaryFlow = exports.analyzeCodeFlow = void 0;
exports.runCodeAnalysis = runCodeAnalysis;
exports.runSummaryGeneration = runSummaryGeneration;
exports.runFixSuggestion = runFixSuggestion;
const genkit_config_1 = __importStar(require("../config/genkit.config"));
const code_review_prompt_1 = require("../prompts/code-review.prompt");
const ai_types_1 = require("../types/ai.types");
/**
 * Main flow for analyzing code submissions
 * This is the primary AI analysis that runs on each submission
 */
exports.analyzeCodeFlow = genkit_config_1.default.defineFlow({
    name: 'analyzeCode',
}, async (input) => {
    const startTime = Date.now();
    try {
        // Generate the prompt
        const prompt = (0, code_review_prompt_1.generateCodeReviewPrompt)(input);
        // Call Gemini with the generated prompt
        const { text } = await genkit_config_1.default.generate({
            model: genkit_config_1.gemini15Pro,
            prompt,
            config: {
                temperature: genkit_config_1.AI_CONFIG.temperature,
                maxOutputTokens: genkit_config_1.AI_CONFIG.maxTokens,
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
            }
            else {
                // Fallback: create structured response from text
                analysisResult = parseUnstructuredAnalysis(text);
            }
        }
        catch (parseError) {
            console.error('Failed to parse AI response as JSON:', parseError);
            analysisResult = parseUnstructuredAnalysis(text);
        }
        // Validate against schema
        const validatedResult = ai_types_1.AIAnalysisResultSchema.parse(analysisResult);
        const processingTime = Date.now() - startTime;
        console.log(`AI analysis completed in ${processingTime}ms`);
        return validatedResult;
    }
    catch (error) {
        console.error('Error in analyzeCodeFlow:', error);
        // Return a fallback result
        return {
            summary: 'AI analysis encountered an error. Please review manually.',
            overallQuality: 'fair',
            confidence: 0.3,
            issues: [],
            strengths: [],
            recommendations: ['Manual review recommended due to AI analysis error'],
        };
    }
});
/**
 * Flow for generating submission summaries
 * Creates quick summaries for reviewers
 */
exports.generateSummaryFlow = genkit_config_1.default.defineFlow({
    name: 'generateSummary',
}, async (input) => {
    try {
        const prompt = (0, code_review_prompt_1.generateSubmissionSummaryPrompt)(input);
        const { text } = await genkit_config_1.default.generate({
            model: genkit_config_1.gemini15Pro,
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
            }
            else {
                summaryResult = parseUnstructuredSummary(text, input.files.length);
            }
        }
        catch (parseError) {
            summaryResult = parseUnstructuredSummary(text, input.files.length);
        }
        return summaryResult;
    }
    catch (error) {
        console.error('Error in generateSummaryFlow:', error);
        return {
            summary: `Code submission with ${input.files.length} file(s). Manual review required.`,
            keyChanges: input.files.map((f) => f.path),
            riskLevel: 'medium',
            reviewPriority: 'medium',
        };
    }
});
/**
 * Flow for suggesting fixes for specific issues
 */
exports.suggestFixFlow = genkit_config_1.default.defineFlow({
    name: 'suggestFix',
}, async (input) => {
    try {
        const prompt = (0, code_review_prompt_1.generateFixSuggestionPrompt)(input);
        const { text } = await genkit_config_1.default.generate({
            model: genkit_config_1.gemini15Pro,
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
            }
            else {
                fixResult = parseUnstructuredFix(text);
            }
        }
        catch (parseError) {
            fixResult = parseUnstructuredFix(text);
        }
        return fixResult;
    }
    catch (error) {
        console.error('Error in suggestFixFlow:', error);
        return {
            fixDescription: 'Unable to generate fix suggestion at this time.',
            explanation: 'Please review the issue manually and apply appropriate fixes.',
        };
    }
});
/**
 * Helper function to parse unstructured AI analysis text
 */
function parseUnstructuredAnalysis(text) {
    // Extract key information from unstructured text
    const issues = [];
    const strengths = [];
    const recommendations = [];
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
    let overallQuality = 'good';
    if (issues.length === 0)
        overallQuality = 'excellent';
    else if (issues.length > 5)
        overallQuality = 'fair';
    else if (issues.length > 10)
        overallQuality = 'poor';
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
function parseUnstructuredSummary(text, fileCount) {
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
function parseUnstructuredFix(text) {
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
async function runCodeAnalysis(input) {
    return await (0, exports.analyzeCodeFlow)(input);
}
/**
 * Convenience function to generate summary
 */
async function runSummaryGeneration(input) {
    return await (0, exports.generateSummaryFlow)(input);
}
/**
 * Convenience function to suggest fix
 */
async function runFixSuggestion(input) {
    return await (0, exports.suggestFixFlow)(input);
}
