import { Router } from 'express';
import { createRuleset, getRulesets, getRuleset, updateRuleset, deleteRuleset } from '../controllers/ruleset.controller';
import { protect, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../entities/user.entity';

const router = Router();

router.use(protect);

router.post('/', roleMiddleware([UserRole.SUPER_ADMIN]), createRuleset);
router.get('/', roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN]), getRulesets);
router.get('/:id', roleMiddleware([UserRole.SUPER_ADMIN, UserRole.ADMIN]), getRuleset);
router.put('/:id', roleMiddleware([UserRole.SUPER_ADMIN]), updateRuleset);
router.delete('/:id', roleMiddleware([UserRole.SUPER_ADMIN]), deleteRuleset);

export default router;
