import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, ManyToMany } from 'typeorm';
import { Company } from './company.entity';
import { Rule as RuleEntity } from './rule.entity';
import { Project } from './project.entity';

export enum RuleType {
    REGEX = 'regex',
    ESLINT = 'eslint',
    AST = 'ast',
    FILE_PATTERN = 'filepattern',
    CONTENT = 'content',
}

export enum RuleSeverity {
    ERROR = 'error',
    WARNING = 'warning',
}

export interface Rule {
    id: string;
    type: RuleType;
    payload: any;
    severity: RuleSeverity;
    message: string;
}

@Entity('rulesets')
export class RuleSet {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => Company, company => company.rulesets)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;
    
    @Column({ name: 'project_id', nullable: true })
    projectId: string;

    @ManyToOne(() => Project, project => project.rulesets)
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @OneToMany(() => RuleEntity, rule => rule.ruleSet, { cascade: ['insert', 'update'], eager: true })
    rules: RuleEntity[];

    // @ManyToMany(() => Project, project => project.rulesets)
    // projects: Project[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}