import { Request, Response, NextFunction } from 'express';
import { aiAnalysisService } from '../ai/services/ai-analysis.service';
import { aiRulesetService } from '../ai/services/ai-ruleset.service';
import { aiReportingService } from '../ai/services/ai-reporting.service';
import { aiSearchService } from '../ai/services/ai-search.service';
import { AppError } from '../utils/errors';

/**
 * Controller for AI-powered features
 */
export class AIController {
  /**
   * Trigger AI analysis for a submission
   * POST /api/ai/analyze/:submissionId
   */
  async analyzeSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const { submissionId } = req.params;

      if (!submissionId) {
        throw new AppError('Submission ID is required', 400);
      }

      // Start analysis (this may take a while)
      const analysis = await aiAnalysisService.analyzeSubmission(submissionId);

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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get AI analysis for a submission
   * GET /api/ai/analysis/:submissionId
   */
  async getAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { submissionId } = req.params;

      const analysis = await aiAnalysisService.getAnalysis(submissionId);

      if (!analysis) {
        throw new AppError('AI analysis not found for this submission', 404);
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate summary for a submission
   * POST /api/ai/summary/:submissionId
   */
  async generateSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { submissionId } = req.params;

      const summary = await aiAnalysisService.generateSubmissionSummary(submissionId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suggest fixes for an issue
   * POST /api/ai/suggest-fix
   */
  async suggestFix(req: Request, res: Response, next: NextFunction) {
    try {
      const { issue, submissionId, language } = req.body;

      if (!issue || !issue.message) {
        throw new AppError('Issue details are required', 400);
      }

      const fixSuggestion = await aiAnalysisService.suggestFix({
        issue,
        submissionId,
        language,
      });

      res.json({
        success: true,
        data: fixSuggestion,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get AI analysis status
   * GET /api/ai/status
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { AI_CONFIG } = await import('../ai/config/genkit.config');

      res.json({
        success: true,
        data: {
          enabled: AI_CONFIG.features.analysis,
          model: AI_CONFIG.model,
          features: AI_CONFIG.features,
        },
      });
    } catch (error) {
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
  async generateRuleset(req: Request, res: Response, next: NextFunction) {
    try {
      const { prompt, projectId, strictness, saveAsTemplate } = req.body;
      const user = (req as any).user;

      if (!prompt) {
        throw new AppError('Prompt is required', 400);
      }

      const result = await aiRulesetService.generateFromPrompt({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get rule templates
   * GET /api/ai/rulesets/templates
   */
  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { category, includePublic } = req.query;

      const templates = await aiRulesetService.getTemplates({
        companyId: user.companyId,
        category: category as string,
        includePublic: includePublic !== 'false',
      });

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Apply template to project
   * POST /api/ai/rulesets/templates/:templateId/apply
   */
  async applyTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { templateId } = req.params;
      const { projectId, customizations } = req.body;
      const user = (req as any).user;

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const ruleset = await aiRulesetService.applyTemplate({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suggest rules from submission history
   * POST /api/ai/rulesets/suggest
   */
  async suggestRules(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, limit } = req.body;

      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const suggestions = await aiRulesetService.suggestRulesFromHistory({
        projectId,
        limit: limit || 50,
      });

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Improve existing ruleset
   * POST /api/ai/rulesets/:rulesetId/improve
   */
  async improveRuleset(req: Request, res: Response, next: NextFunction) {
    try {
      const { rulesetId } = req.params;
      const { feedback, includeStats } = req.body;

      if (!feedback) {
        throw new AppError('Feedback is required', 400);
      }

      const result = await aiRulesetService.improveRuleset({
        rulesetId,
        feedback,
        includeStats: includeStats !== false,
      });

      res.json({
        success: true,
        message: 'Ruleset improved successfully',
        data: result,
      });
    } catch (error) {
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
  async getSubmissionReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { submissionId } = req.params;
      const report = await aiReportingService.generateSubmissionReport(submissionId);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate project-wide AI insights
   * GET /api/ai/report/project/:projectId?limit=20
   */
  async getProjectInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const limit = Number(req.query.limit) || 20;
      const insights = await aiReportingService.generateProjectInsights(projectId, limit);
      res.json({ success: true, data: insights });
    } catch (error) {
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
  async queryCodebase(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, query, limit } = req.body;

      if (!projectId || !query) {
        throw new AppError('Project ID and query are required', 400);
      }

      const result = await aiSearchService.queryCodebase(projectId, query, limit || 10);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Compare two submissions with AI analysis
   * POST /api/ai/compare/submissions
   */
  async compareSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { submission1Id, submission2Id, focus } = req.body;

      if (!submission1Id || !submission2Id) {
        throw new AppError('Both submission IDs are required', 400);
      }

      const result = await aiSearchService.compareSubmissions(
        submission1Id,
        submission2Id,
        focus
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Smart search submissions using natural language
   * POST /api/ai/search/submissions
   */
  async smartSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, query, filters } = req.body;

      if (!projectId || !query) {
        throw new AppError('Project ID and query are required', 400);
      }

      const result = await aiSearchService.smartSearch(projectId, query, filters);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();

