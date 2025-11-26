"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAnalysisService = exports.AIAnalysisService = void 0;
const data_source_1 = require("../../config/data-source");
const submission_entity_1 = require("../../entities/submission.entity");
const ai_analysis_entity_1 = require("../../entities/ai-analysis.entity");
const project_entity_1 = require("../../entities/project.entity");
const code_analysis_flow_1 = require("../flows/code-analysis.flow");
const genkit_config_1 = require("../config/genkit.config");
const adm_zip_1 = __importDefault(require("adm-zip"));
const axios_1 = __importDefault(require("axios"));
/**
 * Service for AI-powered code analysis
 */
class AIAnalysisService {
    constructor() {
        this.submissionRepository = data_source_1.AppDataSource.getRepository(submission_entity_1.Submission);
        this.aiAnalysisRepository = data_source_1.AppDataSource.getRepository(ai_analysis_entity_1.AIAnalysis);
        this.projectRepository = data_source_1.AppDataSource.getRepository(project_entity_1.Project);
    }
    /**
     * Analyze a code submission using AI
     */
    async analyzeSubmission(submissionId) {
        console.log(`Starting AI analysis for submission ${submissionId}`);
        // Check if AI analysis is enabled
        if (!genkit_config_1.AI_CONFIG.features.analysis) {
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
        const existingRules = project?.rulesets?.flatMap(rs => rs.rules?.map(r => ({
            type: r.type,
            message: r.message,
            severity: r.severity,
        })) || []) || [];
        // Run AI analysis
        const startTime = Date.now();
        const analysisResult = await (0, code_analysis_flow_1.runCodeAnalysis)({
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
            modelVersion: genkit_config_1.AI_CONFIG.model,
            processingTimeMs: processingTime,
        });
        await this.aiAnalysisRepository.save(aiAnalysis);
        console.log(`AI analysis completed for submission ${submissionId}`);
        return aiAnalysis;
    }
    /**
     * Get AI analysis for a submission
     */
    async getAnalysis(submissionId) {
        return await this.aiAnalysisRepository.findOne({
            where: { submissionId },
        });
    }
    /**
     * Generate a summary for a submission
     */
    async generateSubmissionSummary(submissionId) {
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
        const summary = await (0, code_analysis_flow_1.runSummaryGeneration)({
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
    async suggestFix(params) {
        let fileContent;
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
        const fixSuggestion = await (0, code_analysis_flow_1.runFixSuggestion)({
            issue: params.issue,
            fileContent,
            language: params.language,
        });
        return fixSuggestion;
    }
    /**
     * Extract files from a ZIP URL
     */
    async extractFilesFromZip(zipUrl) {
        try {
            // Download ZIP file
            const response = await axios_1.default.get(zipUrl, { responseType: 'arraybuffer' });
            const zipBuffer = Buffer.from(response.data);
            // Extract files
            const zip = new adm_zip_1.default(zipBuffer);
            const zipEntries = zip.getEntries();
            const files = [];
            const maxFileSize = 100000; // 100KB limit per file
            const maxFiles = 50; // Limit number of files to analyze
            for (const entry of zipEntries) {
                if (files.length >= maxFiles)
                    break;
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
        }
        catch (error) {
            console.error('Error extracting files from ZIP:', error);
            throw new Error('Failed to extract files from submission');
        }
    }
    /**
     * Check if a file should be analyzed
     */
    isAnalyzableFile(filename) {
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
    detectLanguage(files) {
        const extensionCounts = {};
        files.forEach(file => {
            const ext = file.path.split('.').pop()?.toLowerCase();
            if (ext) {
                extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
            }
        });
        // Find most common extension
        const mostCommon = Object.entries(extensionCounts)
            .sort(([, a], [, b]) => b - a)[0];
        const languageMap = {
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
    convertIssuesToSuggestions(issues) {
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
    mapSeverityToPriority(severity) {
        const map = {
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
    estimateEffort(severity) {
        const map = {
            critical: '2-4 hours',
            high: '1-2 hours',
            medium: '30-60 minutes',
            low: '15-30 minutes',
            info: '5-15 minutes',
        };
        return map[severity] || '30 minutes';
    }
}
exports.AIAnalysisService = AIAnalysisService;
// Export singleton instance
exports.aiAnalysisService = new AIAnalysisService();
