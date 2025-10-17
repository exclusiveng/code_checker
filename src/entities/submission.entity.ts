import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';
import { Review } from './review.entity';

export enum SubmissionStatus {
    PENDING = 'pending',
    PASSED = 'passed',
    FAILED = 'failed',
    REVIEWED = 'reviewed',
}

@Entity('submissions')
export class Submission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'project_id' })
    projectId: string;

    @ManyToOne(() => Project, project => project.submissions)
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @Column({ name: 'developer_id' })
    developerId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'developer_id' })
    developer: User;

    @Column({ type: 'jsonb', name: 'files_metadata' })
    filesMetadata: any;

    @Column({ name: 'zip_url' })
    zipUrl: string;

    @Column({
        type: 'enum',
        enum: SubmissionStatus,
        default: SubmissionStatus.PENDING,
    })
    status: SubmissionStatus;

    @Column({ type: 'jsonb', nullable: true })
    results: any;

    @Column({ type: 'jsonb', name: 'github_push_info', nullable: true })
    githubPushInfo: any;

    @OneToMany(() => Review, review => review.submission)
    reviews: Review[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}