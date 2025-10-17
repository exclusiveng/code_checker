import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../entities/user.entity';
import { listCompanies, getDashboardMetrics, getCompanyDetail } from '../controllers/admin.controller';

const router = Router();

router.use(authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN]));

router.get('/companies', listCompanies);
router.get('/metrics', getDashboardMetrics);
router.get('/companies/:id', getCompanyDetail);

export default router;


