import { AppDataSource } from '../../config/data-source';
import { RuleTemplate } from '../../entities/rule-template.entity';
import { RuleSet } from '../../entities/ruleset.entity';
import { Rule } from '../../entities/rule.entity';
import { Submission } from '../../entities/submission.entity';
import { Project } from '../../entities/project.entity';
import {
  runRulesetGeneration,
  runRuleSuggestions,
  runRulesetImprovement,
} from '../flows/ruleset-generation.flow';
import { AI_CONFIG } from '../config/genkit.config';

/**
 * Service for AI-powered ruleset generation
 */
export class AIRulesetService {
  private ruleTemplateRepository = AppDataSource.getRepository(RuleTemplate);
  private rulesetRepository = AppDataSource.getRepository(RuleSet);
  private ruleRepository = AppDataSource.getRepository(Rule);
  private submissionRepository = AppDataSource.getRepository(Submission);
  private projectRepository = AppDataSource.getRepository(Project);

  /**
   * Generate ruleset from natural language prompt
   */
  async generateFromPrompt(params: {
    prompt: string;
    projectId?: string;
    userId: string;
    companyId?: string;
    strictness?: 'strict' | 'moderate' | 'lenient';
    saveAsTemplate?: boolean;
  }): Promise<{
    ruleset: any;
    template?: RuleTemplate;
  }> {
    console.log(`Generating ruleset from prompt for user ${params.userId}`);

    // Check if AI ruleset generation is enabled
    if (!AI_CONFIG.features.rulesetGeneration) {
      throw new Error('AI ruleset generation is not enabled');
    }

    // Get project context if projectId provided
    let projectContext;
    if (params.projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: params.projectId },
      });
      
      if (project) {
        projectContext = {
          name: project.name,
          description: `Repository: ${project.repoUrl}`,
        };
      }
    }

    // Generate ruleset using AI
    const result = await runRulesetGeneration({
      prompt: params.prompt,
      projectContext,
      strictness: params.strictness || 'moderate',
    });

    // Save as template if requested
    let template;
    if (params.saveAsTemplate) {
      template = this.ruleTemplateRepository.create({
        name: result.name,
        description: result.description,
        prompt: params.prompt,
        generatedRules: result.rules,
        companyId: params.companyId,
        isPublic: false,
        usageCount: 0,
        createdBy: params.userId,
        category: this.detectCategory(result.rules),
        metadata: {
          tags: ['ai-generated', result.suggestedSeverity],
          language: projectContext?.name || 'general',
        },
      });

      await this.ruleTemplateRepository.save(template);
      console.log(`Saved ruleset as template: ${template.id}`);
    }

    return {
      ruleset: result,
      template,
    };
  }

  /**
   * Apply template to project (create actual ruleset)
   */
  async applyTemplate(params: {
    templateId: string;
    projectId: string;
    userId: string;
    companyId?: string; // Added companyId
    customizations?: {
      name?: string;
      adjustSeverity?: 'increase' | 'decrease';
    };
  }): Promise<RuleSet> {
    const template = await this.ruleTemplateRepository.findOne({
      where: { id: params.templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Increment usage count
    template.usageCount += 1;
    await this.ruleTemplateRepository.save(template);

    // Create ruleset
    const ruleset = this.rulesetRepository.create({
      name: params.customizations?.name || template.name,
      description: template.description,
      projectId: params.projectId,
      companyId: params.companyId, // Ensure companyId is passed
    });

    await this.rulesetRepository.save(ruleset);

    // Create rules from template
    const rules = template.generatedRules.map((ruleData: any) => {
      let severity = ruleData.severity;
      
      // Adjust severity if requested
      if (params.customizations?.adjustSeverity === 'increase') {
        if (severity === 'warning') severity = 'error';
        if (severity === 'info') severity = 'warning';
      } else if (params.customizations?.adjustSeverity === 'decrease') {
        if (severity === 'error') severity = 'warning';
        if (severity === 'warning') severity = 'info';
      }

      const rule = new Rule();
      rule.ruleSet = ruleset;
      rule.type = ruleData.type;
      rule.payload = ruleData.payload;
      rule.severity = severity as any;
      rule.message = ruleData.message;
      return rule;
    });

    await this.ruleRepository.save(rules);

    console.log(`Applied template ${template.id} to project ${params.projectId}, created ${rules.length} rules`);

    return ruleset;
  }

  /**
   * Suggest rules based on submission history
   */
  async suggestRulesFromHistory(params: {
    projectId: string;
    limit?: number;
  }): Promise<{
    suggestedRules: any[];
    summary: string;
    estimatedImpact: string;
  }> {
    console.log(`Analyzing submission history for project ${params.projectId}`);

    // Get recent submissions with AI analysis
    const submissions = await this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.project', 'project')
      .leftJoin('ai_analyses', 'analysis', 'analysis.submissionId = submission.id')
      .where('submission.projectId = :projectId', { projectId: params.projectId })
      .andWhere('submission.status = :status', { status: 'failed' })
      .orderBy('submission.createdAt', 'DESC')
      .limit(params.limit || 50)
      .getMany();

    if (submissions.length === 0) {
      return {
        suggestedRules: [],
        summary: 'No failed submissions found to analyze',
        estimatedImpact: '0%',
      };
    }

    // Extract issues from submissions
    const submissionHistory = submissions.map(sub => ({
      id: sub.id,
      issues: this.extractIssuesFromResults(sub.results),
    }));

    // Get project context
    const project = await this.projectRepository.findOne({
      where: { id: params.projectId },
    });

    const projectContext = project ? {
      name: project.name,
      language: this.detectLanguageFromProject(project),
    } : undefined;

    // Generate suggestions
    const result = await runRuleSuggestions({
      submissionHistory,
      projectContext,
    });

    return result;
  }

  /**
   * Improve existing ruleset based on feedback
   */
  async improveRuleset(params: {
    rulesetId: string;
    feedback: string;
    includeStats?: boolean;
  }): Promise<{
    improvedRuleset: any;
    changes: string[];
  }> {
    const ruleset = await this.rulesetRepository.findOne({
      where: { id: params.rulesetId },
      relations: ['rules'],
    });

    if (!ruleset) {
      throw new Error('Ruleset not found');
    }

    // Get submission stats if requested
    let submissionStats;
    if (params.includeStats) {
      const submissions = await this.submissionRepository.find({
        where: { projectId: ruleset.projectId },
      });

      const passed = submissions.filter(s => s.status === 'passed').length;
      const failed = submissions.filter(s => s.status === 'failed').length;

      // Extract common failure reasons
      const failureReasons: Record<string, number> = {};
      submissions
        .filter(s => s.status === 'failed')
        .forEach(sub => {
          const issues = this.extractIssuesFromResults(sub.results);
          issues.forEach(issue => {
            failureReasons[issue.message] = (failureReasons[issue.message] || 0) + 1;
          });
        });

      const commonFailures = Object.entries(failureReasons)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([msg]) => msg);

      submissionStats = {
        totalSubmissions: submissions.length,
        passedSubmissions: passed,
        failedSubmissions: failed,
        commonFailures,
      };
    }

    // Generate improvements
    const result = await runRulesetImprovement({
      currentRuleset: {
        name: ruleset.name,
        rules: ruleset.rules || [],
      },
      feedback: params.feedback,
      submissionStats,
    });

    return {
      improvedRuleset: result,
      changes: result.changes,
    };
  }

  /**
   * Get all templates (public + company-specific)
   */
  async getTemplates(params: {
    companyId?: string;
    category?: string;
    includePublic?: boolean;
  }): Promise<RuleTemplate[]> {
    const query = this.ruleTemplateRepository.createQueryBuilder('template');

    if (params.includePublic !== false) {
      query.where('template.isPublic = :isPublic', { isPublic: true });
      
      if (params.companyId) {
        query.orWhere('template.companyId = :companyId', { companyId: params.companyId });
      }
    } else if (params.companyId) {
      query.where('template.companyId = :companyId', { companyId: params.companyId });
    }

    if (params.category) {
      query.andWhere('template.category = :category', { category: params.category });
    }

    query.orderBy('template.usageCount', 'DESC');

    return await query.getMany();
  }

  /**
   * Helper: Extract issues from submission results
   */
  private extractIssuesFromResults(results: any): Array<{
    category: string;
    severity: string;
    message: string;
    frequency: number;
  }> {
    if (!results || !results.findings) return [];

    return results.findings.map((finding: any) => ({
      category: finding.ruleId || 'general',
      severity: finding.severity || 'warning',
      message: finding.message || 'Unknown issue',
      frequency: 1,
    }));
  }

  /**
   * Helper: Detect category from rules
   */
  private detectCategory(rules: any[]): string {
    const types = rules.map(r => r.type);
    if (types.includes('security') || types.some(t => t.includes('security'))) return 'security';
    if (types.includes('dependency')) return 'dependencies';
    if (types.includes('style') || types.includes('formatting')) return 'style';
    return 'code-quality';
  }

  /**
   * Helper: Detect language from project
   */
  private detectLanguageFromProject(project: Project): string {
    // Simple heuristic based on repo URL or name
    const lower = (project.repoUrl + project.name).toLowerCase();
    if (lower.includes('ts') || lower.includes('typescript')) return 'typescript';
    if (lower.includes('js') || lower.includes('javascript')) return 'javascript';
    if (lower.includes('py') || lower.includes('python')) return 'python';
    if (lower.includes('go')) return 'go';
    return 'general';
  }
}

export const aiRulesetService = new AIRulesetService();
