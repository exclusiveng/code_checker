import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Company } from './company.entity';
import { RuleSet } from './ruleset.entity';
import { Submission } from './submission.entity';

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => Company, company => company.projects)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column()
    name: string;

    @Column({ name: 'repo_url' })
    repoUrl: string;

    @OneToMany(() => RuleSet, ruleset => ruleset.project, { cascade: true })
    rulesets: RuleSet[];

    @OneToMany(() => Submission, submission => submission.project)
    submissions: Submission[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}