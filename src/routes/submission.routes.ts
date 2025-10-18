import { Router } from 'express';
import {
  uploadSubmission,
  pushToGithub,
  getSubmissionStatus,
  getSubmissions,
} from '../controllers/submission.controller';
import { protect, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../entities/user.entity';
import reviewRoutes from './review.routes';

const router = Router();

router.get('/', protect, getSubmissions);
router.post('/upload', protect, uploadSubmission);
router.get('/:id/status', protect, getSubmissionStatus);

router.use('/:id/reviews', reviewRoutes);

router.post('/:id/push', protect, roleMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]), pushToGithub);

export default router;
