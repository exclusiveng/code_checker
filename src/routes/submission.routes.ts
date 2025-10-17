import { Router } from 'express';
import { uploadSubmission, pushToGithub, getSubmissionStatus } from '../controllers/submission.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../entities/user.entity';
import reviewRoutes from './review.routes';

const router = Router();

router.post('/upload', authMiddleware, uploadSubmission);
router.get('/:id/status', authMiddleware, getSubmissionStatus);

router.use('/:id/reviews', reviewRoutes);

router.post('/:id/push', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]), pushToGithub);

export default router;
