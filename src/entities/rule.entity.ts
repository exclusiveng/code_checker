import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RuleSet } from './ruleset.entity';

export enum RuleType {
  REGEX = 'regex',
  ESLINT = 'eslint',
  AST = 'ast',
  FILE_PATTERN = 'filepattern',
  CONTENT = 'content',
  DEPENDENCY = 'dependency',
}

export enum RuleSeverity {
  ERROR = 'error',
  WARNING = 'warning',
}

@Entity('rules')
export class Rule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation to RuleSet - match property name defined on RuleSet (rules)
  @ManyToOne(() => RuleSet, ruleSet => ruleSet.rules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rule_set_id' })
  ruleSet: RuleSet;

  @Column({
    type: 'enum',
    enum: RuleType,
  })
  type: RuleType;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({
    type: 'enum',
    enum: RuleSeverity,
  })
  severity: RuleSeverity;

  @Column()
  message: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
