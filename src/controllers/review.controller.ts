import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { Review } from '../entities/review.entity';
import { Submission, SubmissionStatus } from '../entities/submission.entity';
import { BadRequestError } from '../utils/errors';

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  const { comments, approved } = req.body;
  const { id: submissionId } = req.params;

  if (comments === undefined || approved === undefined) {
    return next(new BadRequestError('Missing required fields'));
  }

  const submissionRepository = AppDataSource.getRepository(Submission);
  const submission = await submissionRepository.findOne({ where: { id: submissionId } });

  if (!submission) {
    return next(new BadRequestError('Submission not found'));
  }

  const reviewRepository = AppDataSource.getRepository(Review);

  const reviewerId = req.user?.id;
  if (!reviewerId) {
    return next(new BadRequestError('Authenticated user not found'));
  }

  const newReview = reviewRepository.create({
    comments,
    approved,
    submissionId,
    reviewerId,
  });

  await reviewRepository.save(newReview);

  if (approved) {
    submission.status = SubmissionStatus.REVIEWED;
    await submissionRepository.save(submission);
  }

  res.status(201).json(newReview);
};

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  const { id: submissionId } = req.params;
  const reviewRepository = AppDataSource.getRepository(Review);
  const reviews = await reviewRepository.find({ where: { submissionId } });
  res.json(reviews);
};
