"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All AI routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * AI Analysis Routes (Phase 1)
 */
// Trigger AI analysis for a submission
router.post('/analyze/:submissionId', ai_controller_1.aiController.analyzeSubmission.bind(ai_controller_1.aiController));
// Get AI analysis for a submission
router.get('/analysis/:submissionId', ai_controller_1.aiController.getAnalysis.bind(ai_controller_1.aiController));
// Generate summary for a submission
router.post('/summary/:submissionId', ai_controller_1.aiController.generateSummary.bind(ai_controller_1.aiController));
// Suggest fixes for an issue
router.post('/suggest-fix', ai_controller_1.aiController.suggestFix.bind(ai_controller_1.aiController));
// Get AI service status
router.get('/status', ai_controller_1.aiController.getStatus.bind(ai_controller_1.aiController));
/**
 * Ruleset Generation Routes (Phase 2)
 */
// Generate ruleset from natural language prompt
router.post('/rulesets/generate', ai_controller_1.aiController.generateRuleset.bind(ai_controller_1.aiController));
// Get rule templates
router.get('/rulesets/templates', ai_controller_1.aiController.getTemplates.bind(ai_controller_1.aiController));
// Apply template to project
router.post('/rulesets/templates/:templateId/apply', ai_controller_1.aiController.applyTemplate.bind(ai_controller_1.aiController));
// Suggest rules from submission history
router.post('/rulesets/suggest', ai_controller_1.aiController.suggestRules.bind(ai_controller_1.aiController));
// Improve existing ruleset
router.post('/rulesets/:rulesetId/improve', ai_controller_1.aiController.improveRuleset.bind(ai_controller_1.aiController));
/**
 * Reporting Routes (Phase 3)
 */
// Get AI-generated report for a submission
router.get('/report/submission/:submissionId', ai_controller_1.aiController.getSubmissionReport.bind(ai_controller_1.aiController));
// Get AI-generated insights for a project
router.get('/report/project/:projectId', ai_controller_1.aiController.getProjectInsights.bind(ai_controller_1.aiController));
/**
 * Search & Query Routes (Phase 4)
 */
// Query codebase using natural language
router.post('/query/codebase', ai_controller_1.aiController.queryCodebase.bind(ai_controller_1.aiController));
// Compare two submissions
router.post('/compare/submissions', ai_controller_1.aiController.compareSubmissions.bind(ai_controller_1.aiController));
// Smart search submissions
router.post('/search/submissions', ai_controller_1.aiController.smartSearch.bind(ai_controller_1.aiController));
exports.default = router;
