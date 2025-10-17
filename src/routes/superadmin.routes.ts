import { Router } from 'express';
import { createSuperAdmin } from '../controllers/superadmin.controller';

const router = Router();

// Intentionally unprotected to bootstrap the first tenant; consider gating behind an env flag in production.
router.post('/', createSuperAdmin);

export default router;


