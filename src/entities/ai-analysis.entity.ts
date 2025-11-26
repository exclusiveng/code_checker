import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Submission } from './submission.entity';

@Entity('ai_analyses')
export class AIAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  submissionId!: string;

  @ManyToOne(() => Submission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submissionId' })
  submission!: Submission;

  @Column('text')
  summary!: string;

  @Column('varchar', { length: 50 })
  overallQuality!: 'excellent' | 'good' | 'fair' | 'poor';

  @Column('jsonb')
  insights!: {
    issues: Array<{
      severity: string;
      category: string;
      message: string;
      explanation: string;
      location?: {
        file?: string;
        line?: number;
        column?: number;
      };
      suggestedFix?: string;
      codeSnippet?: string;
    }>;
    strengths: string[];
    recommendations: string[];
  };

  @Column('jsonb', { nullable: true })
  suggestions!: Array<{
    type: string;
    description: string;
    priority: string;
    estimatedEffort?: string;
  }>;

  @Column('float')
  confidence!: number;

  @Column('varchar', { length: 100 })
  modelVersion!: string;

  @Column('integer', { nullable: true })
  tokensUsed?: number;

  @Column('integer', { nullable: true })
  processingTimeMs?: number;

  @CreateDateColumn()
  createdAt!: Date;
}
