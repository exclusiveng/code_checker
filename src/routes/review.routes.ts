import { Router } from 'express';
import { createReview, getReviews } from '../controllers/review.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../entities/user.entity';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', roleMiddleware([UserRole.REVIEWER, UserRole.ADMIN]), createReview);
router.get('/', roleMiddleware([UserRole.REVIEWER, UserRole.ADMIN, UserRole.DEVELOPER]), getReviews);

export default router;
