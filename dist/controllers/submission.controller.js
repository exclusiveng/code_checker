"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubmissions = exports.pushToGithub = exports.getSubmissionStatus = exports.uploadSubmission = void 0;
const multer_1 = __importDefault(require("multer"));
const submission_entity_1 = require("../entities/submission.entity");
const queue_1 = require("../config/queue");
const errors_1 = require("../utils/errors");
const github_service_1 = require("../services/github.service");
const s3_service_1 = require("../services/s3.service");
const data_source_1 = require("../config/data-source");
const project_entity_1 = require("../entities/project.entity");
const notification_service_1 = require("../services/notification.service");
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
}).any();
const uploadSubmission = (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) {
            return next(err);
        }
        const anyReq = req;
        const uploadedFile = Array.isArray(anyReq.files)
            ? anyReq.files[0]
            : anyReq.file; // fallback to single-file handlers
        if (!uploadedFile) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        // Accept either projectId (UUID) or projectSlug (human id)
        let { projectId, projectSlug } = req.body;
        if (!projectId && !projectSlug) {
            return next(new errors_1.BadRequestError('projectId or projectSlug is required.'));
        }
        const projectRepository = data_source_1.AppDataSource.getRepository(project_entity_1.Project);
        let project = null;
        if (projectId) {
            project = await projectRepository.findOne({ where: { id: projectId } });
        }
        else if (projectSlug) {
            project = await projectRepository.findOne({ where: { slug: projectSlug } });
            if (project)
                projectId = project.id;
        }
        if (!project) {
            return next(new errors_1.BadRequestError(`Project not found.`));
        }
        if (!project) {
            return next(new errors_1.BadRequestError(`Project with id ${projectId} not found.`));
        }
        // Ensure the project has at least one ruleset configured. Processing relies
        // on project-specific rules; if none exist, reject the upload with a helpful
        // message to encourage creating a ruleset first.
        const rulesetRepository = data_source_1.AppDataSource.getRepository(require('../entities/ruleset.entity').RuleSet);
        const projectRulesets = await rulesetRepository.find({ where: { projectId } });
        if (!projectRulesets || projectRulesets.length === 0) {
            return next(new errors_1.BadRequestError('This project does not have any rulesets configured. Create a ruleset for the project before uploading submissions.'));
        }
        const submissionRepository = data_source_1.AppDataSource.getRepository(submission_entity_1.Submission);
        // Ensure user is present on the request
        const developerId = req.user?.id;
        if (!developerId) {
            return next(new errors_1.BadRequestError('Authenticated user not found on request'));
        }
        let zipUrl = uploadedFile.path;
        try {
            if (process.env.S3_BUCKET) {
                const key = `submissions/${developerId}/${Date.now()}-${uploadedFile.originalname}`;
                const buffer = await (await Promise.resolve().then(() => __importStar(require('fs')))).promises.readFile(uploadedFile.path);
                zipUrl = await (0, s3_service_1.uploadBufferToS3)({
                    bucket: process.env.S3_BUCKET,
                    key,
                    body: buffer,
                    contentType: uploadedFile.mimetype,
                });
            }
        }
        catch (e) {
            return next(new errors_1.BadRequestError('Failed to upload to storage'));
        }
        const newSubmission = submissionRepository.create({
            developerId,
            projectId,
            filesMetadata: [{ filename: uploadedFile.filename }],
            zipUrl,
            status: submission_entity_1.SubmissionStatus.PENDING,
        });
        await submissionRepository.save(newSubmission);
        // Notify creation
        await notification_service_1.notificationService.send({
            event: notification_service_1.NotificationEvent.SUBMISSION_CREATED,
            submissionId: newSubmission.id,
            status: newSubmission.status,
        });
        // Use lazy queue getter so we don't attempt Redis connection at module import
        try {
            const submissionQueue = (0, queue_1.getSubmissionQueue)();
            await submissionQueue.add('submission-analysis', {
                submissionId: newSubmission.id,
            });
            await notification_service_1.notificationService.send({
                event: notification_service_1.NotificationEvent.SUBMISSION_QUEUED,
                submissionId: newSubmission.id,
                status: newSubmission.status,
            });
        }
        catch (err) {
            // Log queue errors but allow request to succeed so dev doesn't fail when Redis is absent
            console.error('Failed to enqueue submission analysis:', err);
        }
        res.status(201).json({
            message: 'File uploaded successfully, analysis queued.',
            submission: newSubmission,
        });
    });
};
exports.uploadSubmission = uploadSubmission;
const getSubmissionStatus = async (req, res, next) => {
    const { id: submissionId } = req.params;
    const submissionRepository = data_source_1.AppDataSource.getRepository(submission_entity_1.Submission);
    const submission = await submissionRepository.findOne({
        where: { id: submissionId },
        relations: ['project'],
    });
    if (!submission) {
        return next(new errors_1.BadRequestError('Submission not found'));
    }
    const user = req.user;
    if (!user)
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    if (user.role === 'admin' ||
        user.role === 'reviewer' ||
        user.role === 'super_admin') {
        return res.json(submission);
    }
    // Developer can view only their own submission
    if (user.role === 'developer' && submission.developerId === user.id) {
        return res.json(submission);
    }
    return next(new errors_1.BadRequestError('Insufficient permissions to view this submission'));
};
exports.getSubmissionStatus = getSubmissionStatus;
const pushToGithub = async (req, res, next) => {
    const { id: submissionId } = req.params;
    const submissionRepository = data_source_1.AppDataSource.getRepository(submission_entity_1.Submission);
    const projectRepository = data_source_1.AppDataSource.getRepository(project_entity_1.Project);
    const submission = await submissionRepository.findOne({
        where: { id: submissionId },
    });
    if (!submission) {
        return next(new errors_1.BadRequestError('Submission not found'));
    }
    if (submission.status !== submission_entity_1.SubmissionStatus.REVIEWED) {
        return next(new errors_1.BadRequestError('Submission has not been approved'));
    }
    const project = await projectRepository.findOne({
        where: { id: submission.projectId },
    });
    if (!project) {
        return next(new errors_1.BadRequestError('Project not found for submission'));
    }
    const repo = (0, github_service_1.parseRepoUrl)(project.repoUrl);
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        return next(new errors_1.BadRequestError('GitHub token not configured'));
    }
    const branchName = `submission-${submission.id}`;
    const prTitle = `Submission ${submission.id} - Automated Import`;
    const prBody = `Automated import for submission ${submission.id}.\n\nResults: \n\n\`\n${JSON.stringify(submission.results || {}, null, 2)}\n\``;
    try {
        const { prUrl } = await (0, github_service_1.createBranchCommitAndPR)({
            token,
            repo,
            baseBranch: 'main',
            branchName,
            zipPath: submission.zipUrl,
            prTitle,
            prBody,
        });
        res.json({ message: 'Pull request created', prUrl });
    }
    catch (err) {
        return next(new errors_1.BadRequestError(`GitHub push failed: ${err?.message || 'unknown error'}`));
    }
};
exports.pushToGithub = pushToGithub;
const getSubmissions = async (req, res, next) => {
    if (!req.user) {
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    }
    const developerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const submissionRepository = data_source_1.AppDataSource.getRepository(submission_entity_1.Submission);
    const [submissions, total] = await submissionRepository.findAndCount({
        where: { developerId },
        relations: ['project'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip,
    });
    res.json({
        data: submissions,
        meta: {
            total,
            page,
            last_page: Math.ceil(total / limit),
        },
    });
};
exports.getSubmissions = getSubmissions;
