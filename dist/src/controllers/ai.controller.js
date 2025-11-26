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
exports.aiController = exports.AIController = void 0;
const ai_analysis_service_1 = require("../ai/services/ai-analysis.service");
const ai_ruleset_service_1 = require("../ai/services/ai-ruleset.service");
const ai_reporting_service_1 = require("../ai/services/ai-reporting.service");
const ai_search_service_1 = require("../ai/services/ai-search.service");
const errors_1 = require("../utils/errors");
/**
 * Controller for AI-powered features
 */
class AIController {
    /**
     * Trigger AI analysis for a submission
     * POST /api/ai/analyze/:submissionId
     */
    async analyzeSubmission(req, res, next) {
        try {
            const { submissionId } = req.params;
            if (!submissionId) {
                throw new errors_1.AppError('Submission ID is required', 400);
            }
            // Start analysis (this may take a while)
            const analysis = await ai_analysis_service_1.aiAnalysisService.analyzeSubmission(submissionId);
            res.json({
                success: true,
                message: 'AI analysis completed',
                data: {
                    id: analysis.id,
                    submissionId: analysis.submissionId,
                    summary: analysis.summary,
                    overallQuality: analysis.overallQuality,
                    confidence: analysis.confidence,
                    insights: analysis.insights,
                    suggestions: analysis.suggestions,
                    modelVersion: analysis.modelVersion,
                    processingTimeMs: analysis.processingTimeMs,
                    createdAt: analysis.createdAt,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get AI analysis for a submission
     * GET /api/ai/analysis/:submissionId
     */
    async getAnalysis(req, res, next) {
        try {
            const { submissionId } = req.params;
            const analysis = await ai_analysis_service_1.aiAnalysisService.getAnalysis(submissionId);
            if (!analysis) {
                throw new errors_1.AppError('AI analysis not found for this submission', 404);
            }
            res.json({
                success: true,
                data: {
                    id: analysis.id,
                    submissionId: analysis.submissionId,
                    summary: analysis.summary,
                    overallQuality: analysis.overallQuality,
                    confidence: analysis.confidence,
                    insights: analysis.insights,
                    suggestions: analysis.suggestions,
                    modelVersion: analysis.modelVersion,
                    processingTimeMs: analysis.processingTimeMs,
                    createdAt: analysis.createdAt,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Generate summary for a submission
     * POST /api/ai/summary/:submissionId
     */
    async generateSummary(req, res, next) {
        try {
            const { submissionId } = req.params;
            const summary = await ai_analysis_service_1.aiAnalysisService.generateSubmissionSummary(submissionId);
            res.json({
                success: true,
                data: summary,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Suggest fixes for an issue
     * POST /api/ai/suggest-fix
     */
    async suggestFix(req, res, next) {
        try {
            const { issue, submissionId, language } = req.body;
            if (!issue || !issue.message) {
                throw new errors_1.AppError('Issue details are required', 400);
            }
            const fixSuggestion = await ai_analysis_service_1.aiAnalysisService.suggestFix({
                issue,
                submissionId,
                language,
            });
            res.json({
                success: true,
                data: fixSuggestion,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get AI analysis status
     * GET /api/ai/status
     */
    async getStatus(req, res, next) {
        try {
            const { AI_CONFIG } = await Promise.resolve().then(() => __importStar(require('../ai/config/genkit.config')));
            res.json({
                success: true,
                data: {
                    enabled: AI_CONFIG.features.analysis,
                    model: AI_CONFIG.model,
                    features: AI_CONFIG.features,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // ============================================
    // RULESET GENERATION ENDPOINTS (Phase 2)
    // ============================================
    /**
     * Generate ruleset from natural language prompt
     * POST /api/ai/rulesets/generate
     */
    async generateRuleset(req, res, next) {
        try {
            const { prompt, projectId, strictness, saveAsTemplate } = req.body;
            const user = req.user;
            if (!prompt) {
                throw new errors_1.AppError('Prompt is required', 400);
            }
            const result = await ai_ruleset_service_1.aiRulesetService.generateFromPrompt({
                prompt,
                projectId,
                userId: user.id,
                companyId: user.companyId,
                strictness: strictness || 'moderate',
                saveAsTemplate: saveAsTemplate || false,
            });
            res.json({
                success: true,
                message: 'Ruleset generated successfully',
                data: {
                    ruleset: result.ruleset,
                    template: result.template ? {
                        id: result.template.id,
                        name: result.template.name,
                        description: result.template.description,
                    } : null,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get rule templates
     * GET /api/ai/rulesets/templates
     */
    async getTemplates(req, res, next) {
        try {
            const user = req.user;
            const { category, includePublic } = req.query;
            const templates = await ai_ruleset_service_1.aiRulesetService.getTemplates({
                companyId: user.companyId,
                category: category,
                includePublic: includePublic !== 'false',
            });
            res.json({
                success: true,
                data: templates,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Apply template to project
     * POST /api/ai/rulesets/templates/:templateId/apply
     */
    async applyTemplate(req, res, next) {
        try {
            const { templateId } = req.params;
            const { projectId, customizations } = req.body;
            const user = req.user;
            if (!projectId) {
                throw new errors_1.AppError('Project ID is required', 400);
            }
            const ruleset = await ai_ruleset_service_1.aiRulesetService.applyTemplate({
                templateId,
                projectId,
                userId: user.id,
                companyId: user.companyId, // Pass companyId from authenticated user
                customizations,
            });
            res.json({
                success: true,
                message: 'Template applied successfully',
                data: ruleset,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Suggest rules from submission history
     * POST /api/ai/rulesets/suggest
     */
    async suggestRules(req, res, next) {
        try {
            const { projectId, limit } = req.body;
            if (!projectId) {
                throw new errors_1.AppError('Project ID is required', 400);
            }
            const suggestions = await ai_ruleset_service_1.aiRulesetService.suggestRulesFromHistory({
                projectId,
                limit: limit || 50,
            });
            res.json({
                success: true,
                data: suggestions,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Improve existing ruleset
     * POST /api/ai/rulesets/:rulesetId/improve
     */
    async improveRuleset(req, res, next) {
        try {
            const { rulesetId } = req.params;
            const { feedback, includeStats } = req.body;
            if (!feedback) {
                throw new errors_1.AppError('Feedback is required', 400);
            }
            const result = await ai_ruleset_service_1.aiRulesetService.improveRuleset({
                rulesetId,
                feedback,
                includeStats: includeStats !== false,
            });
            res.json({
                success: true,
                message: 'Ruleset improved successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // ============================================
    // REPORTING ENDPOINTS (Phase 3)
    // ============================================
    /**
     * Generate AI-powered report for a single submission
     * GET /api/ai/report/submission/:submissionId
     */
    async getSubmissionReport(req, res, next) {
        try {
            const { submissionId } = req.params;
            const report = await ai_reporting_service_1.aiReportingService.generateSubmissionReport(submissionId);
            res.json({ success: true, data: report });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Generate project-wide AI insights
     * GET /api/ai/report/project/:projectId?limit=20
     */
    async getProjectInsights(req, res, next) {
        try {
            const { projectId } = req.params;
            const limit = Number(req.query.limit) || 20;
            const insights = await ai_reporting_service_1.aiReportingService.generateProjectInsights(projectId, limit);
            res.json({ success: true, data: insights });
        }
        catch (error) {
            next(error);
        }
    }
    // ============================================
    // SEARCH & QUERY ENDPOINTS (Phase 4)
    // ============================================
    /**
     * Query codebase using natural language
     * POST /api/ai/query/codebase
     */
    async queryCodebase(req, res, next) {
        try {
            const { projectId, query, limit } = req.body;
            if (!projectId || !query) {
                throw new errors_1.AppError('Project ID and query are required', 400);
            }
            const result = await ai_search_service_1.aiSearchService.queryCodebase(projectId, query, limit || 10);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Compare two submissions with AI analysis
     * POST /api/ai/compare/submissions
     */
    async compareSubmissions(req, res, next) {
        try {
            const { submission1Id, submission2Id, focus } = req.body;
            if (!submission1Id || !submission2Id) {
                throw new errors_1.AppError('Both submission IDs are required', 400);
            }
            const result = await ai_search_service_1.aiSearchService.compareSubmissions(submission1Id, submission2Id, focus);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Smart search submissions using natural language
     * POST /api/ai/search/submissions
     */
    async smartSearch(req, res, next) {
        try {
            const { projectId, query, filters } = req.body;
            if (!projectId || !query) {
                throw new errors_1.AppError('Project ID and query are required', 400);
            }
            const result = await ai_search_service_1.aiSearchService.smartSearch(projectId, query, filters);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AIController = AIController;
exports.aiController = new AIController();
