import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../entities/user.entity';
import { createProject } from '../controllers/project.controller';

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.post('/', roleMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]), createProject);

export default router;


