import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

/**
 * AI Analysis Routes (Phase 1)
 */

// Trigger AI analysis for a submission
router.post('/analyze/:submissionId', aiController.analyzeSubmission.bind(aiController));

// Get AI analysis for a submission
router.get('/analysis/:submissionId', aiController.getAnalysis.bind(aiController));

// Generate summary for a submission
router.post('/summary/:submissionId', aiController.generateSummary.bind(aiController));

// Suggest fixes for an issue
router.post('/suggest-fix', aiController.suggestFix.bind(aiController));

// Get AI service status
router.get('/status', aiController.getStatus.bind(aiController));

/**
 * Ruleset Generation Routes (Phase 2)
 */

// Generate ruleset from natural language prompt
router.post('/rulesets/generate', aiController.generateRuleset.bind(aiController));

// Get rule templates
router.get('/rulesets/templates', aiController.getTemplates.bind(aiController));

// Apply template to project
router.post('/rulesets/templates/:templateId/apply', aiController.applyTemplate.bind(aiController));

// Suggest rules from submission history
router.post('/rulesets/suggest', aiController.suggestRules.bind(aiController));

// Improve existing ruleset
router.post('/rulesets/:rulesetId/improve', aiController.improveRuleset.bind(aiController));

/**
 * Reporting Routes (Phase 3)
 */

// Get AI-generated report for a submission
router.get('/report/submission/:submissionId', aiController.getSubmissionReport.bind(aiController));

// Get AI-generated insights for a project
router.get('/report/project/:projectId', aiController.getProjectInsights.bind(aiController));

/**
 * Search & Query Routes (Phase 4)
 */

// Query codebase using natural language
router.post('/query/codebase', aiController.queryCodebase.bind(aiController));

// Compare two submissions
router.post('/compare/submissions', aiController.compareSubmissions.bind(aiController));

// Smart search submissions
router.post('/search/submissions', aiController.smartSearch.bind(aiController));

export default router;


