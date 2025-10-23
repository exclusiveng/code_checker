import { Router } from 'express';
import { protect, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../entities/user.entity';
import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';

const router = Router();

router.use(protect);

const adminAccess = roleMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

router.post('/', adminAccess, createUser);
router.get('/', adminAccess, getUsers);
router.put('/:id', adminAccess, updateUser);
router.delete('/:id', adminAccess, deleteUser);

export default router;
