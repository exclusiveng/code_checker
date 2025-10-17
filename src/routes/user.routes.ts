import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../entities/user.entity';
import { createUser } from '../controllers/user.controller';

const router = Router();

router.use(authMiddleware);
router.post('/', roleMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]), createUser);

export default router;


