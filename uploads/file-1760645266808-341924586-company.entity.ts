import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { RuleSet } from './ruleset.entity';

@Entity('companies')
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'jsonb', nullable: true })
    settings: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToMany(() => User, user => user.company)
    users: User[];

    @OneToMany(() => Project, project => project.company)
    projects: Project[];

    @OneToMany(() => RuleSet, ruleset => ruleset.company)
    rulesets: RuleSet[];
}