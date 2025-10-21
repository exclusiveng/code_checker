import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { Submission, SubmissionStatus } from '../entities/submission.entity';
import { getSubmissionQueue } from '../config/queue';
import { BadRequestError } from '../utils/errors';
import {
  createBranchCommitAndPR,
  parseRepoUrl,
} from '../services/github.service';
import { uploadBufferToS3 } from '../services/s3.service';
import { AppDataSource } from '../config/data-source';
import { Project } from '../entities/project.entity';
import {
  notificationService,
  NotificationEvent,
} from '../services/notification.service';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
}).any(); 

export const uploadSubmission = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  upload(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    const anyReq: any = req as any;
    const uploadedFile = Array.isArray(anyReq.files)
      ? anyReq.files[0]
      : anyReq.file; // fallback to single-file handlers

    if (!uploadedFile) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Require projectId (UUID) only
    const { projectId } = req.body as any;
    if (!projectId) return next(new BadRequestError('projectId is required.'));

    const projectRepository = AppDataSource.getRepository(Project);
    const project = await projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      return next(new BadRequestError(`Project with id ${projectId} not found.`));
    }

    // Ensure the project has at least one ruleset configured. Processing relies
    // on project-specific rules; if none exist, reject the upload with a helpful
    // message to encourage creating a ruleset first.
    const rulesetRepository = AppDataSource.getRepository(require('../entities/ruleset.entity').RuleSet);
    const projectRulesets = await rulesetRepository.find({ where: { projectId } });
    if (!projectRulesets || projectRulesets.length === 0) {
      return next(new BadRequestError('This project does not have any rulesets configured. Create a ruleset for the project before uploading submissions.'));
    }

    const submissionRepository = AppDataSource.getRepository(Submission);

    // Ensure user is present on the request
    const developerId = req.user?.id;
    if (!developerId) {
      return next(
        new BadRequestError('Authenticated user not found on request'),
      );
    }

    let zipUrl = uploadedFile.path;
    try {
      if (process.env.S3_BUCKET) {
        const key = `submissions/${developerId}/${Date.now()}-${uploadedFile.originalname}`;
        const buffer = await (
          await import('fs')
        ).promises.readFile(uploadedFile.path);
        zipUrl = await uploadBufferToS3({
          bucket: process.env.S3_BUCKET,
          key,
          body: buffer,
          contentType: uploadedFile.mimetype,
        });
      }
    } catch (e) {
      return next(new BadRequestError('Failed to upload to storage'));
    }

    const newSubmission = submissionRepository.create({
      developerId,
      projectId,
      filesMetadata: [{ filename: uploadedFile.filename }],
      zipUrl,
      status: SubmissionStatus.PENDING,
    } as Partial<Submission>);

    await submissionRepository.save(newSubmission);

    // Notify creation
    await notificationService.send({
      event: NotificationEvent.SUBMISSION_CREATED,
      submissionId: newSubmission.id,
      status: newSubmission.status,
    });

    // Use lazy queue getter so we don't attempt Redis connection at module import
    try {
      const submissionQueue = getSubmissionQueue();
      await submissionQueue.add('submission-analysis', {
        submissionId: newSubmission.id,
      });

      await notificationService.send({
        event: NotificationEvent.SUBMISSION_QUEUED,
        submissionId: newSubmission.id,
        status: newSubmission.status,
      });
    } catch (err) {
      // Log queue errors but allow request to succeed so dev doesn't fail when Redis is absent
      console.error('Failed to enqueue submission analysis:', err);
    }

    res.status(201).json({
      message: 'File uploaded successfully, analysis queued.',
      submission: newSubmission,
    });
  });
};

export const getSubmissionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id: submissionId } = req.params;
  const submissionRepository = AppDataSource.getRepository(Submission);
  const submission = await submissionRepository.findOne({
    where: { id: submissionId },
    relations: ['project'], 
  });
  if (!submission) {
    return next(new BadRequestError('Submission not found'));
  }

  const user = req.user;
  if (!user) return next(new BadRequestError('Authenticated user not found'));


  if (
    user.role === 'admin' ||
    user.role === 'reviewer' ||
    user.role === 'super_admin'
  ) {
    
    return res.json(submission);
  }

  // Developer can view only their own submission
  if (user.role === 'developer' && submission.developerId === user.id) {
    return res.json(submission);
  }

  return next(
    new BadRequestError('Insufficient permissions to view this submission'),
  );
};

export const pushToGithub = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id: submissionId } = req.params;

  const submissionRepository = AppDataSource.getRepository(Submission);
  const projectRepository = AppDataSource.getRepository(Project);
  const submission = await submissionRepository.findOne({
    where: { id: submissionId },
  });

  if (!submission) {
    return next(new BadRequestError('Submission not found'));
  }

  if (submission.status !== SubmissionStatus.REVIEWED) {
    return next(new BadRequestError('Submission has not been approved'));
  }

  const project = await projectRepository.findOne({
    where: { id: submission.projectId },
  });
  if (!project) {
    return next(new BadRequestError('Project not found for submission'));
  }

  const repo = parseRepoUrl(project.repoUrl);
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return next(new BadRequestError('GitHub token not configured'));
  }

  const branchName = `submission-${submission.id}`;
  const prTitle = `Submission ${submission.id} - Automated Import`;
  const prBody = `Automated import for submission ${submission.id}.\n\nResults: \n\n\`\n${JSON.stringify(submission.results || {}, null, 2)}\n\``;

  try {
    const { prUrl } = await createBranchCommitAndPR({
      token,
      repo,
      baseBranch: 'main',
      branchName,
      zipPath: submission.zipUrl,
      prTitle,
      prBody,
    });
    res.json({ message: 'Pull request created', prUrl });
  } catch (err: any) {
    return next(
      new BadRequestError(
        `GitHub push failed: ${err?.message || 'unknown error'}`,
      ),
    );
  }
};

export const getSubmissions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new BadRequestError('Authenticated user not found'));
  }

  const developerId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const submissionRepository = AppDataSource.getRepository(Submission);

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
