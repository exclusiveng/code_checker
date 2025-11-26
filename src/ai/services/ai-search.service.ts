import { AppDataSource } from '../../config/data-source';
import { Submission } from '../../entities/submission.entity';
import { codebaseQueryFlow, submissionComparisonFlow, smartSearchFlow } from '../flows/search.flow';
import { AppError } from '../../utils/errors';
import * as fs from 'fs';
import * as path from 'path';

export class AISearchService {
  /**
   * Recursively read all code files from a directory
   */
  private readCodeFilesRecursively(dir: string, maxFiles = 20): string {
    let code = '';
    let filesRead = 0;

    const supportedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rb', '.php'];

    const readDir = (currentDir: string) => {
      if (filesRead >= maxFiles) return;

      try {
        if (!fs.existsSync(currentDir)) return;

        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          if (filesRead >= maxFiles) break;

          const fullPath = path.join(currentDir, entry.name);

          // Skip node_modules, .git, and other common directories
          if (entry.isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry.name)) {
              readDir(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (supportedExtensions.includes(ext)) {
              try {
                const fileContent = fs.readFileSync(fullPath, 'utf-8');
                const relativePath = path.relative(dir, fullPath);
                code += `\n// File: ${relativePath}\n${fileContent}\n\n`;
                filesRead++;
              } catch (error) {
                console.error(`Failed to read file ${fullPath}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to read directory ${currentDir}:`, error);
      }
    };

    readDir(dir);
    return code;
  }

  /**
   * Read code from a submission
   */
  private async readSubmissionCode(submissionId: string, zipUrl?: string): Promise<string> {
    // Try multiple possible locations
    const possiblePaths = [
      path.join(process.cwd(), 'uploads', 'extracted', submissionId),
      path.join(process.cwd(), 'uploads', submissionId),
      path.join(process.cwd(), 'temp', submissionId),
    ];

    // If zipUrl is provided, try to extract from it
    if (zipUrl) {
      const zipPath = path.join(process.cwd(), zipUrl.replace(/^\//, ''));
      if (fs.existsSync(zipPath)) {
        // Add the directory containing the zip
        possiblePaths.unshift(path.dirname(zipPath));
      }
    }

    for (const basePath of possiblePaths) {
      if (fs.existsSync(basePath)) {
        const code = this.readCodeFilesRecursively(basePath);
        if (code.trim()) {
          console.log(`✅ Successfully read code from: ${basePath}`);
          return code;
        }
      }
    }

    console.warn(`⚠️ No code files found for submission ${submissionId}`);
    return '// No code files found. Please ensure the submission has been uploaded and extracted.';
  }

  /**
   * Query the codebase using natural language
   */
  async queryCodebase(projectId: string, query: string, limit = 10) {
    const submissionRepo = AppDataSource.getRepository(Submission);
    
    // Get recent submissions for the project
    const submissions = await submissionRepo.find({
      where: { project: { id: projectId } },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['project'],
    });

    if (!submissions.length) {
      throw new AppError('No submissions found for this project', 404);
    }

    console.log(`📂 Reading code from ${submissions.length} submissions...`);

    // Read code from submission files
    const submissionsWithCode = await Promise.all(
      submissions.map(async (sub) => {
        const code = await this.readSubmissionCode(sub.id, sub.zipUrl);
        
        return {
          id: sub.id,
          code,
          results: sub.results,
        };
      })
    );

    // Log how much code was found
    const totalCodeLength = submissionsWithCode.reduce((sum, s) => sum + s.code.length, 0);
    console.log(`📊 Total code read: ${totalCodeLength} characters from ${submissionsWithCode.length} submissions`);

    const result = await codebaseQueryFlow({
      query,
      submissions: submissionsWithCode,
      context: {
        projectName: submissions[0].project?.name,
        language: 'typescript', // Could be detected from project settings
      },
    });

    return result;
  }

  /**
   * Compare two submissions with AI analysis
   */
  async compareSubmissions(submission1Id: string, submission2Id: string, focus?: 'quality' | 'performance' | 'security' | 'all') {
    const submissionRepo = AppDataSource.getRepository(Submission);
    
    const [sub1, sub2] = await Promise.all([
      submissionRepo.findOne({ where: { id: submission1Id } }),
      submissionRepo.findOne({ where: { id: submission2Id } }),
    ]);

    if (!sub1 || !sub2) {
      throw new AppError('One or both submissions not found', 404);
    }

    console.log(`📂 Reading code for comparison...`);

    // Read code for both submissions
    const [code1, code2] = await Promise.all([
      this.readSubmissionCode(sub1.id, sub1.zipUrl),
      this.readSubmissionCode(sub2.id, sub2.zipUrl),
    ]);

    console.log(`📊 Submission 1: ${code1.length} chars, Submission 2: ${code2.length} chars`);

    const result = await submissionComparisonFlow({
      submission1: {
        id: sub1.id,
        code: code1,
        results: sub1.results,
        createdAt: sub1.createdAt,
      },
      submission2: {
        id: sub2.id,
        code: code2,
        results: sub2.results,
        createdAt: sub2.createdAt,
      },
      comparisonFocus: focus || 'all',
    });

    return result;
  }

  /**
   * Smart search submissions using natural language
   */
  async smartSearch(projectId: string, query: string, filters?: any) {
    const submissionRepo = AppDataSource.getRepository(Submission);
    
    // Build query with filters
    const queryBuilder = submissionRepo
      .createQueryBuilder('submission')
      .where('submission.projectId = :projectId', { projectId })
      .orderBy('submission.createdAt', 'DESC')
      .take(50);

    if (filters?.status) {
      queryBuilder.andWhere('submission.status IN (:...statuses)', { statuses: filters.status });
    }

    if (filters?.dateRange) {
      queryBuilder.andWhere('submission.createdAt >= :start', { start: filters.dateRange.start });
      queryBuilder.andWhere('submission.createdAt <= :end', { end: filters.dateRange.end });
    }

    const submissions = await queryBuilder.getMany();

    if (!submissions.length) {
      return {
        interpretation: 'No submissions found matching the criteria',
        results: [],
      };
    }

    const result = await smartSearchFlow({
      query,
      submissions: submissions.map(sub => ({
        id: sub.id,
        metadata: {
          status: sub.status,
          createdAt: sub.createdAt,
        },
        results: sub.results,
      })),
      filters,
    });

    return result;
  }
}

export const aiSearchService = new AISearchService();

