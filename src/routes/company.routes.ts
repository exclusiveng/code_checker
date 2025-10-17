import { Router } from 'express';
import projectRoutes from './project.routes';

const router = Router();

// nest project creation under company
router.use('/:id/projects', projectRoutes);

export default router;


