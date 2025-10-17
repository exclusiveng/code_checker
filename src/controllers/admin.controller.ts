import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { Company } from '../entities/company.entity';
import { Project } from '../entities/project.entity';
import { Submission, SubmissionStatus } from '../entities/submission.entity';
import { Review } from '../entities/review.entity';
import { BadRequestError } from '../utils/errors';

export const listCompanies = async (req: Request, res: Response, next: NextFunction) => {
  const admin = req.user;
  if (!admin) return next(new BadRequestError('Authenticated user not found'));

  const companyRepository = AppDataSource.getRepository(Company);
  // For now, SUPER_ADMIN can view only their own company. If global admins are added later,
  // expand this to list all companies.
  const companies = await companyRepository.find({ where: { id: admin.companyId } });
  res.json(companies);
};

export const getDashboardMetrics = async (req: Request, res: Response, next: NextFunction) => {
  const admin = req.user;
  if (!admin) return next(new BadRequestError('Authenticated user not found'));

  const companyId = admin.companyId;
  const projectRepository = AppDataSource.getRepository(Project);
  const submissionRepository = AppDataSource.getRepository(Submission);
  const reviewRepository = AppDataSource.getRepository(Review);

  // Aggregations
  const [projects, totalSubmissions, pendingSubmissions, failedSubmissions, reviewedSubmissions] = await Promise.all([
    projectRepository.count({ where: { companyId } }),
    submissionRepository
      .count({
        where: {
          project: {
            companyId: companyId,
          },
        },
      }),
    submissionRepository
      .count({
        where: {
          status: SubmissionStatus.PENDING,
          project: { companyId: companyId },
        },
      }),
    submissionRepository
      .count({
        where: {
          status: SubmissionStatus.FAILED,
          project: { companyId: companyId },
        },
      }),
    submissionRepository
      .count({
        where: {
          status: SubmissionStatus.REVIEWED,
          project: { companyId: companyId },
        },
      }),
  ]);

  const totalReviews = await reviewRepository
    .createQueryBuilder('r')
    .innerJoin('r.submission', 's')
    .innerJoin('s.project', 'p')
    .where('p.company_id = :companyId', { companyId })
    .getCount();

  res.json({
    projects,
    submissions: {
      total: totalSubmissions,
      pending: pendingSubmissions,
      failed: failedSubmissions,
      reviewed: reviewedSubmissions,
    },
    reviews: totalReviews,
  });
};

export const getCompanyDetail = async (req: Request, res: Response, next: NextFunction) => {
  const admin = req.user;
  if (!admin) return next(new BadRequestError('Authenticated user not found'));
  const { id } = req.params; // company id

  // Ensure admin only accesses their own company for now
  if (id !== admin.companyId) return next(new BadRequestError('Company not accessible'));

  const companyRepository = AppDataSource.getRepository(Company);
  const projectRepository = AppDataSource.getRepository(Project);
  const submissionRepository = AppDataSource.getRepository(Submission);

  const company = await companyRepository.findOne({ where: { id } });
  if (!company) return next(new BadRequestError('Company not found'));

  const [projects, submissionCounts] = await Promise.all([
    projectRepository.find({ where: { companyId: id } }),
    submissionRepository
      .createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('s.project', 'p')
      .where('p.company_id = :companyId', { companyId: id })
      .groupBy('s.status')
      .getRawMany(),
  ]);

  res.json({ company, projects, submissionCounts });
};
