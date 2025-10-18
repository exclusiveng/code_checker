import { Router } from 'express';
import { protect, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../entities/user.entity';
import { createProject, getProjects } from '../controllers/project.controller';

const router = Router({ mergeParams: true });

router.use(protect);

router.get('/', getProjects);
router.post('/', roleMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]), createProject);

export default router;
