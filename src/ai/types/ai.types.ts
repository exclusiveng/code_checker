import { z } from 'zod';

/**
 * AI Analysis Types
 */

// Code Issue Schema
export const CodeIssueSchema = z.object({
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  category: z.string(),
  message: z.string(),
  explanation: z.string(),
  location: z.object({
    file: z.string().optional(),
    line: z.number().optional(),
    column: z.number().optional(),
  }).optional(),
  suggestedFix: z.string().optional(),
  codeSnippet: z.string().optional(),
});

export type CodeIssue = z.infer<typeof CodeIssueSchema>;

// AI Analysis Result Schema
export const AIAnalysisResultSchema = z.object({
  summary: z.string(),
  overallQuality: z.enum(['excellent', 'good', 'fair', 'poor']),
  confidence: z.number().min(0).max(1),
  issues: z.array(CodeIssueSchema),
  strengths: z.array(z.string()),
  recommendations: z.array(z.string()),
  estimatedReviewTime: z.string().optional(),
});

export type AIAnalysisResult = z.infer<typeof AIAnalysisResultSchema>;

/**
 * Ruleset Generation Types
 */

// Generated Rule Schema
export const GeneratedRuleSchema = z.object({
  type: z.enum(['filepattern', 'content', 'structure', 'dependency']),
  payload: z.record(z.string(), z.any()),
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string(),
  explanation: z.string(),
});

export type GeneratedRule = z.infer<typeof GeneratedRuleSchema>;

// Ruleset Generation Result Schema
export const RulesetGenerationResultSchema = z.object({
  name: z.string(),
  description: z.string(),
  rules: z.array(GeneratedRuleSchema),
  rationale: z.string(),
  suggestedSeverity: z.enum(['strict', 'moderate', 'lenient']),
});

export type RulesetGenerationResult = z.infer<typeof RulesetGenerationResultSchema>;

/**
 * Search & Query Types
 */

export const SearchResultSchema = z.object({
  submissionId: z.string(),
  relevanceScore: z.number().min(0).max(1),
  summary: z.string(),
  matchedContent: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export const SearchResponseSchema = z.object({
  answer: z.string(),
  results: z.array(SearchResultSchema),
  confidence: z.number().min(0).max(1),
  suggestions: z.array(z.string()).optional(),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;

/**
 * Documentation Types
 */

export const DocumentationSectionSchema: z.ZodType<any> = z.object({
  title: z.string(),
  content: z.string(),
  subsections: z.array(z.lazy(() => DocumentationSectionSchema)).optional(),
});

export type DocumentationSection = z.infer<typeof DocumentationSectionSchema>;

export const GeneratedDocumentationSchema = z.object({
  title: z.string(),
  overview: z.string(),
  sections: z.array(DocumentationSectionSchema),
  generatedAt: z.string(),
});

export type GeneratedDocumentation = z.infer<typeof GeneratedDocumentationSchema>;

/**
 * Common AI Types
 */

export interface AIFlowInput<T = any> {
  data: T;
  context?: Record<string, any>;
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  };
}

export interface AIFlowOutput<T = any> {
  result: T;
  metadata: {
    modelUsed: string;
    tokensUsed?: number;
    processingTime: number;
    confidence?: number;
  };
}

/**
 * Template Types
 */

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  generatedRules: GeneratedRule[];
  companyId?: string;
  isPublic: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI Conversation Types
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AIConversation {
  id: string;
  userId: string;
  projectId?: string;
  messages: ChatMessage[];
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
