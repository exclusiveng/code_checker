"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyDetail = exports.getDashboardMetrics = exports.listCompanies = void 0;
const data_source_1 = require("../config/data-source");
const company_entity_1 = require("../entities/company.entity");
const project_entity_1 = require("../entities/project.entity");
const submission_entity_1 = require("../entities/submission.entity");
const review_entity_1 = require("../entities/review.entity");
const errors_1 = require("../utils/errors");
const listCompanies = async (req, res, next) => {
    const admin = req.user;
    if (!admin)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    const companyRepository = data_source_1.AppDataSource.getRepository(company_entity_1.Company);
    const companies = await companyRepository.find({ where: { id: admin.companyId } });
    res.json(companies);
};
exports.listCompanies = listCompanies;
const getDashboardMetrics = async (req, res, next) => {
    const admin = req.user;
    if (!admin)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    const companyId = admin.companyId;
    const projectRepository = data_source_1.AppDataSource.getRepository(project_entity_1.Project);
    const submissionRepository = data_source_1.AppDataSource.getRepository(submission_entity_1.Submission);
    const reviewRepository = data_source_1.AppDataSource.getRepository(review_entity_1.Review);
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
                status: submission_entity_1.SubmissionStatus.PENDING,
                project: { companyId: companyId },
            },
        }),
        submissionRepository
            .count({
            where: {
                status: submission_entity_1.SubmissionStatus.FAILED,
                project: { companyId: companyId },
            },
        }),
        submissionRepository
            .count({
            where: {
                status: submission_entity_1.SubmissionStatus.REVIEWED,
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
exports.getDashboardMetrics = getDashboardMetrics;
const getCompanyDetail = async (req, res, next) => {
    const admin = req.user;
    if (!admin)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    const { id } = req.params; // company id
    // Ensure admin can only accesses their own company
    if (id !== admin.companyId)
        return next(new errors_1.BadRequestError('Company not accessible'));
    const companyRepository = data_source_1.AppDataSource.getRepository(company_entity_1.Company);
    const projectRepository = data_source_1.AppDataSource.getRepository(project_entity_1.Project);
    const submissionRepository = data_source_1.AppDataSource.getRepository(submission_entity_1.Submission);
    const company = await companyRepository.findOne({ where: { id } });
    if (!company)
        return next(new errors_1.BadRequestError('Company not found'));
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
exports.getCompanyDetail = getCompanyDetail;
