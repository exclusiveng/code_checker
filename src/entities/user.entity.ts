import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from './company.entity';

export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    ADMIN = 'admin',
    REVIEWER = 'reviewer',
    DEVELOPER = 'developer',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.DEVELOPER,
    })
    role: UserRole;

    @Column({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => Company, company => company.users)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}