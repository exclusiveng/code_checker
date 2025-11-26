"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviews = exports.createReview = void 0;
const data_source_1 = require("../config/data-source");
const review_entity_1 = require("../entities/review.entity");
const submission_entity_1 = require("../entities/submission.entity");
const errors_1 = require("../utils/errors");
const createReview = async (req, res, next) => {
    const { comments, approved } = req.body;
    const { id: submissionId } = req.params;
    if (comments === undefined || approved === undefined) {
        return next(new errors_1.BadRequestError('Missing required fields'));
    }
    const submissionRepository = data_source_1.AppDataSource.getRepository(submission_entity_1.Submission);
    const submission = await submissionRepository.findOne({ where: { id: submissionId } });
    if (!submission) {
        return next(new errors_1.BadRequestError('Submission not found'));
    }
    const reviewRepository = data_source_1.AppDataSource.getRepository(review_entity_1.Review);
    const reviewerId = req.user?.id;
    if (!reviewerId) {
        return next(new errors_1.BadRequestError('Authenticated user not found'));
    }
    const newReview = reviewRepository.create({
        comments,
        approved,
        submissionId,
        reviewerId,
    });
    await reviewRepository.save(newReview);
    if (approved) {
        submission.status = submission_entity_1.SubmissionStatus.REVIEWED;
        await submissionRepository.save(submission);
    }
    res.status(201).json(newReview);
};
exports.createReview = createReview;
const getReviews = async (req, res, next) => {
    const { id: submissionId } = req.params;
    const reviewRepository = data_source_1.AppDataSource.getRepository(review_entity_1.Review);
    const reviews = await reviewRepository.find({ where: { submissionId } });
    res.json(reviews);
};
exports.getReviews = getReviews;
