"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratedDocumentationSchema = exports.DocumentationSectionSchema = exports.SearchResponseSchema = exports.SearchResultSchema = exports.RulesetGenerationResultSchema = exports.GeneratedRuleSchema = exports.AIAnalysisResultSchema = exports.CodeIssueSchema = void 0;
const zod_1 = require("zod");
/**
 * AI Analysis Types
 */
// Code Issue Schema
exports.CodeIssueSchema = zod_1.z.object({
    severity: zod_1.z.enum(['critical', 'high', 'medium', 'low', 'info']),
    category: zod_1.z.string(),
    message: zod_1.z.string(),
    explanation: zod_1.z.string(),
    location: zod_1.z.object({
        file: zod_1.z.string().optional(),
        line: zod_1.z.number().optional(),
        column: zod_1.z.number().optional(),
    }).optional(),
    suggestedFix: zod_1.z.string().optional(),
    codeSnippet: zod_1.z.string().optional(),
});
// AI Analysis Result Schema
exports.AIAnalysisResultSchema = zod_1.z.object({
    summary: zod_1.z.string(),
    overallQuality: zod_1.z.enum(['excellent', 'good', 'fair', 'poor']),
    confidence: zod_1.z.number().min(0).max(1),
    issues: zod_1.z.array(exports.CodeIssueSchema),
    strengths: zod_1.z.array(zod_1.z.string()),
    recommendations: zod_1.z.array(zod_1.z.string()),
    estimatedReviewTime: zod_1.z.string().optional(),
});
/**
 * Ruleset Generation Types
 */
// Generated Rule Schema
exports.GeneratedRuleSchema = zod_1.z.object({
    type: zod_1.z.enum(['filepattern', 'content', 'structure', 'dependency']),
    payload: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
    severity: zod_1.z.enum(['error', 'warning', 'info']),
    message: zod_1.z.string(),
    explanation: zod_1.z.string(),
});
// Ruleset Generation Result Schema
exports.RulesetGenerationResultSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    rules: zod_1.z.array(exports.GeneratedRuleSchema),
    rationale: zod_1.z.string(),
    suggestedSeverity: zod_1.z.enum(['strict', 'moderate', 'lenient']),
});
/**
 * Search & Query Types
 */
exports.SearchResultSchema = zod_1.z.object({
    submissionId: zod_1.z.string(),
    relevanceScore: zod_1.z.number().min(0).max(1),
    summary: zod_1.z.string(),
    matchedContent: zod_1.z.string().optional(),
    highlights: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.SearchResponseSchema = zod_1.z.object({
    answer: zod_1.z.string(),
    results: zod_1.z.array(exports.SearchResultSchema),
    confidence: zod_1.z.number().min(0).max(1),
    suggestions: zod_1.z.array(zod_1.z.string()).optional(),
});
/**
 * Documentation Types
 */
exports.DocumentationSectionSchema = zod_1.z.object({
    title: zod_1.z.string(),
    content: zod_1.z.string(),
    subsections: zod_1.z.array(zod_1.z.lazy(() => exports.DocumentationSectionSchema)).optional(),
});
exports.GeneratedDocumentationSchema = zod_1.z.object({
    title: zod_1.z.string(),
    overview: zod_1.z.string(),
    sections: zod_1.z.array(exports.DocumentationSectionSchema),
    generatedAt: zod_1.z.string(),
});
