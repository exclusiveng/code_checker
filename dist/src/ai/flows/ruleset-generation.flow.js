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
exports.improveRulesetFlow = exports.suggestRulesFlow = exports.generateRulesetFlow = void 0;
exports.runRulesetGeneration = runRulesetGeneration;
exports.runRuleSuggestions = runRuleSuggestions;
exports.runRulesetImprovement = runRulesetImprovement;
const genkit_config_1 = __importStar(require("../config/genkit.config"));
const ruleset_generation_prompt_1 = require("../prompts/ruleset-generation.prompt");
/**
 * Flow: Generate ruleset from natural language prompt
 */
exports.generateRulesetFlow = genkit_config_1.default.defineFlow({
    name: 'generateRuleset',
}, async (input) => {
    const startTime = Date.now();
    try {
        console.log(`Generating ruleset from prompt: "${input.prompt.substring(0, 100)}..."`);
        const prompt = (0, ruleset_generation_prompt_1.generateRulesetPrompt)(input);
        const { text } = await genkit_config_1.default.generate({
            model: genkit_config_1.gemini15Pro,
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
            }
            else {
                throw new Error('No JSON found in response');
            }
        }
        catch (parseError) {
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
            rulesetResult.rules = rulesetResult.rules.filter((rule) => rule.type && rule.payload && rule.severity && rule.message);
        }
        const processingTime = Date.now() - startTime;
        console.log(`Ruleset generated in ${processingTime}ms with ${rulesetResult.rules?.length || 0} rules`);
        return rulesetResult;
    }
    catch (error) {
        console.error('Error in generateRulesetFlow:', error);
        return {
            name: 'Error Generating Ruleset',
            description: 'Failed to generate ruleset from prompt',
            rules: [],
            rationale: 'An error occurred during generation. Please try again with a more specific prompt.',
            suggestedSeverity: 'moderate',
        };
    }
});
/**
 * Flow: Suggest rules based on submission history
 */
exports.suggestRulesFlow = genkit_config_1.default.defineFlow({
    name: 'suggestRules',
}, async (input) => {
    try {
        console.log(`Analyzing ${input.submissionHistory.length} submissions for rule suggestions`);
        const prompt = (0, ruleset_generation_prompt_1.generateRuleSuggestionsPrompt)(input);
        const { text } = await genkit_config_1.default.generate({
            model: genkit_config_1.gemini15Pro,
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
            }
            else {
                throw new Error('No JSON found in response');
            }
        }
        catch (parseError) {
            console.error('Failed to parse suggestions response:', parseError);
            suggestionsResult = {
                suggestedRules: [],
                summary: 'Failed to generate suggestions',
                estimatedImpact: '0%',
            };
        }
        return suggestionsResult;
    }
    catch (error) {
        console.error('Error in suggestRulesFlow:', error);
        return {
            suggestedRules: [],
            summary: 'Error analyzing submission history',
            estimatedImpact: '0%',
        };
    }
});
/**
 * Flow: Improve existing ruleset
 */
exports.improveRulesetFlow = genkit_config_1.default.defineFlow({
    name: 'improveRuleset',
}, async (input) => {
    try {
        console.log(`Improving ruleset: ${input.currentRuleset.name}`);
        const prompt = (0, ruleset_generation_prompt_1.generateRulesetImprovementPrompt)(input);
        const { text } = await genkit_config_1.default.generate({
            model: genkit_config_1.gemini15Pro,
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
            }
            else {
                throw new Error('No JSON found in response');
            }
        }
        catch (parseError) {
            console.error('Failed to parse improvement response:', parseError);
            improvementResult = {
                ...input.currentRuleset,
                changes: ['Failed to generate improvements'],
                rationale: 'Error parsing AI response',
            };
        }
        return improvementResult;
    }
    catch (error) {
        console.error('Error in improveRulesetFlow:', error);
        return {
            ...input.currentRuleset,
            description: input.currentRuleset.name,
            changes: ['Error occurred during improvement'],
            rationale: 'Please try again',
        };
    }
});
/**
 * Convenience functions
 */
async function runRulesetGeneration(input) {
    return await (0, exports.generateRulesetFlow)(input);
}
async function runRuleSuggestions(input) {
    return await (0, exports.suggestRulesFlow)(input);
}
async function runRulesetImprovement(input) {
    return await (0, exports.improveRulesetFlow)(input);
}
