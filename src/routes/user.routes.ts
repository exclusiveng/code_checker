import { Router } from 'express';
import { protect, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../entities/user.entity';
import { createUser, getUsers } from '../controllers/user.controller';

const router = Router();

router.use(protect);
router.post('/', roleMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]), createUser);
router.get('/', roleMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]), getUsers);

export default router;


