import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Company } from './company.entity';
import { User } from './user.entity';

@Entity('rule_templates')
export class RuleTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('text')
  description!: string;

  @Column('text')
  prompt!: string;

  @Column('jsonb')
  generatedRules!: Array<{
    type: string;
    payload: Record<string, any>;
    severity: string;
    message: string;
    explanation?: string;
  }>;

  @Column('uuid', { nullable: true })
  companyId?: string;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  @Column('boolean', { default: false })
  isPublic!: boolean;

  @Column('integer', { default: 0 })
  usageCount!: number;

  @Column('uuid')
  createdBy!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  creator!: User;

  @Column('varchar', { length: 50, nullable: true })
  category?: string;

  @Column('jsonb', { nullable: true })
  metadata?: {
    tags?: string[];
    language?: string;
    framework?: string;
    difficulty?: string;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
