import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Submission } from './submission.entity';
import { User } from './user.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'submission_id' })
    submissionId: string;

    @ManyToOne(() => Submission, submission => submission.reviews)
    @JoinColumn({ name: 'submission_id' })
    submission: Submission;

    @Column({ name: 'reviewer_id' })
    reviewerId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reviewer_id' })
    reviewer: User;

    @Column('text', { nullable: true })
    comments: string;

    @Column({ nullable: true })
    approved: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}