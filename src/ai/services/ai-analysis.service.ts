import { AppDataSource } from '../../config/data-source';
import { Submission } from '../../entities/submission.entity';
import { AIAnalysis } from '../../entities/ai-analysis.entity';
import { Project } from '../../entities/project.entity';
import { runCodeAnalysis, runSummaryGeneration, runFixSuggestion } from '../flows/code-analysis.flow';
import { AI_CONFIG } from '../config/genkit.config';
import AdmZip from 'adm-zip';
import axios from 'axios';
import { CodeIssue } from '../types/ai.types';

/**
 * Service for AI-powered code analysis
 */
export class AIAnalysisService {
  private submissionRepository = AppDataSource.getRepository(Submission);
  private aiAnalysisRepository = AppDataSource.getRepository(AIAnalysis);
  private projectRepository = AppDataSource.getRepository(Project);

  /**
   * Analyze a code submission using AI
   */
  async analyzeSubmission(submissionId: string): Promise<AIAnalysis> {
    console.log(`Starting AI analysis for submission ${submissionId}`);

    // Check if AI analysis is enabled
    if (!AI_CONFIG.features.analysis) {
      throw new Error('AI analysis is not enabled');
    }

    // Get submission
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: ['project'],
    });

    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    // Check if analysis already exists
    const existingAnalysis = await this.aiAnalysisRepository.findOne({
      where: { submissionId },
    });

    if (existingAnalysis) {
      console.log(`AI analysis already exists for submission ${submissionId}`);
      return existingAnalysis;
    }

    // Extract files from ZIP
    const files = await this.extractFilesFromZip(submission.zipUrl);

    // Get project context
    const project = await this.projectRepository.findOne({
      where: { id: submission.projectId },
      relations: ['rulesets', 'rulesets.rules'],
    });

    const projectContext = project ? {
      name: project.name,
      description: `Repository: ${project.repoUrl}`,
      language: this.detectLanguage(files),
    } : undefined;

    // Get existing rules for context
    const existingRules = project?.rulesets?.flatMap(rs => 
      rs.rules?.map(r => ({
        type: r.type,
        message: r.message,
        severity: r.severity,
      })) || []
    ) || [];

    // Run AI analysis
    const startTime = Date.now();
    const analysisResult = await runCodeAnalysis({
      files: files.map(f => ({
        path: f.path,
        content: f.content,
        size: f.content.length,
      })),
      projectContext,
      existingRules,
      focusAreas: ['security', 'performance', 'maintainability'],
    });

    const processingTime = Date.now() - startTime;

    // Save analysis to database
    const aiAnalysis = this.aiAnalysisRepository.create({
      submissionId,
      summary: analysisResult.summary,
      overallQuality: analysisResult.overallQuality,
      insights: {
        issues: analysisResult.issues,
        strengths: analysisResult.strengths,
        recommendations: analysisResult.recommendations,
      },
      suggestions: this.convertIssuesToSuggestions(analysisResult.issues),
      confidence: analysisResult.confidence,
      modelVersion: AI_CONFIG.model,
      processingTimeMs: processingTime,
    });

    await this.aiAnalysisRepository.save(aiAnalysis);

    console.log(`AI analysis completed for submission ${submissionId}`);
    return aiAnalysis;
  }

  /**
   * Get AI analysis for a submission
   */
  async getAnalysis(submissionId: string): Promise<AIAnalysis | null> {
    return await this.aiAnalysisRepository.findOne({
      where: { submissionId },
    });
  }

  /**
   * Generate a summary for a submission
   */
  async generateSubmissionSummary(submissionId: string): Promise<{
    summary: string;
    keyChanges: string[];
    riskLevel: string;
    reviewPriority: string;
  }> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    // Extract files
    const files = await this.extractFilesFromZip(submission.zipUrl);

    // Get existing analysis if available
    const analysis = await this.getAnalysis(submissionId);
    const analysisResults = analysis ? {
      issues: analysis.insights.issues,
      strengths: analysis.insights.strengths,
    } : undefined;

    // Generate summary
    const summary = await runSummaryGeneration({
      files: files.map(f => ({
        path: f.path,
        content: f.content,
      })),
      analysisResults,
    });

    return summary;
  }

  /**
   * Suggest fixes for a specific issue
   */
  async suggestFix(params: {
    issue: {
      message: string;
      severity: string;
      file?: string;
      codeSnippet?: string;
    };
    submissionId?: string;
    language?: string;
  }): Promise<{
    fixDescription: string;
    codeExample?: string;
    explanation: string;
    alternativeApproaches?: string[];
  }> {
    let fileContent: string | undefined;

    // If we have a submission ID and file, get the full file content
    if (params.submissionId && params.issue.file) {
      const submission = await this.submissionRepository.findOne({
        where: { id: params.submissionId },
      });

      if (submission) {
        const files = await this.extractFilesFromZip(submission.zipUrl);
        const targetFile = files.find(f => f.path === params.issue.file);
        fileContent = targetFile?.content;
      }
    }

    // Generate fix suggestion
    const fixSuggestion = await runFixSuggestion({
      issue: params.issue,
      fileContent,
      language: params.language,
    });

    return fixSuggestion;
  }

  /**
   * Extract files from a ZIP URL
   */
  private async extractFilesFromZip(zipUrl: string): Promise<Array<{ path: string; content: string }>> {
    try {
      // Download ZIP file
      const response = await axios.get(zipUrl, { responseType: 'arraybuffer' });
      const zipBuffer = Buffer.from(response.data);

      // Extract files
      const zip = new AdmZip(zipBuffer);
      const zipEntries = zip.getEntries();

      const files: Array<{ path: string; content: string }> = [];
      const maxFileSize = 100000; // 100KB limit per file
      const maxFiles = 50; // Limit number of files to analyze

      for (const entry of zipEntries) {
        if (files.length >= maxFiles) break;
        
        if (!entry.isDirectory && this.isAnalyzableFile(entry.entryName)) {
          const content = entry.getData().toString('utf8');
          
          // Skip very large files
          if (content.length > maxFileSize) {
            console.log(`Skipping large file: ${entry.entryName}`);
            continue;
          }

          files.push({
            path: entry.entryName,
            content,
          });
        }
      }

      return files;
    } catch (error) {
      console.error('Error extracting files from ZIP:', error);
      throw new Error('Failed to extract files from submission');
    }
  }

  /**
   * Check if a file should be analyzed
   */
  private isAnalyzableFile(filename: string): boolean {
    const analyzableExtensions = [
      '.ts', '.tsx', '.js', '.jsx',
      '.py', '.java', '.go', '.rs',
      '.c', '.cpp', '.h', '.hpp',
      '.cs', '.rb', '.php', '.swift',
      '.kt', '.scala', '.sql',
      '.json', '.yaml', '.yml',
      '.md', '.txt',
    ];

    const skipPatterns = [
      'node_modules/',
      'dist/',
      'build/',
      '.git/',
      'vendor/',
      '__pycache__/',
      '.next/',
      'coverage/',
    ];

    // Skip files in excluded directories
    if (skipPatterns.some(pattern => filename.includes(pattern))) {
      return false;
    }

    // Check if file has analyzable extension
    return analyzableExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Detect primary programming language from files
   */
  private detectLanguage(files: Array<{ path: string; content: string }>): string {
    const extensionCounts: Record<string, number> = {};

    files.forEach(file => {
      const ext = file.path.split('.').pop()?.toLowerCase();
      if (ext) {
        extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
      }
    });

    // Find most common extension
    const mostCommon = Object.entries(extensionCounts)
      .sort(([, a], [, b]) => b - a)[0];

    const languageMap: Record<string, string> = {
      ts: 'TypeScript',
      tsx: 'TypeScript',
      js: 'JavaScript',
      jsx: 'JavaScript',
      py: 'Python',
      java: 'Java',
      go: 'Go',
      rs: 'Rust',
      cpp: 'C++',
      c: 'C',
      cs: 'C#',
      rb: 'Ruby',
      php: 'PHP',
    };

    return mostCommon ? languageMap[mostCommon[0]] || 'Unknown' : 'Unknown';
  }

  /**
   * Convert issues to actionable suggestions
   */
  private convertIssuesToSuggestions(issues: CodeIssue[]): Array<{
    type: string;
    description: string;
    priority: string;
    estimatedEffort?: string;
  }> {
    return issues.map(issue => ({
      type: issue.category,
      description: issue.suggestedFix || issue.message,
      priority: this.mapSeverityToPriority(issue.severity),
      estimatedEffort: this.estimateEffort(issue.severity),
    }));
  }

  /**
   * Map severity to priority
   */
  private mapSeverityToPriority(severity: string): string {
    const map: Record<string, string> = {
      critical: 'urgent',
      high: 'high',
      medium: 'medium',
      low: 'low',
      info: 'low',
    };
    return map[severity] || 'medium';
  }

  /**
   * Estimate effort to fix an issue
   */
  private estimateEffort(severity: string): string {
    const map: Record<string, string> = {
      critical: '2-4 hours',
      high: '1-2 hours',
      medium: '30-60 minutes',
      low: '15-30 minutes',
      info: '5-15 minutes',
    };
    return map[severity] || '30 minutes';
  }
}

// Export singleton instance
export const aiAnalysisService = new AIAnalysisService();
