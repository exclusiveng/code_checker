import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import { AppDataSource } from './config/data-source';
import authRoutes from './routes/auth.routes';
import { AppError } from './utils/errors';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { startWorker } from './worker';

// --- CORS Configuration ---
// Allow requests from your React frontend development server
const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200, // For legacy browser support
};
app.use(cors(corsOptions));

// app.use(limiter);
// Parse JSON bodies
app.use(express.json());
// Parse urlencoded bodies (form submissions)
app.use(bodyParser.urlencoded({ extended: true }));

import submissionRoutes from './routes/submission.routes';
import rulesetRoutes from './routes/ruleset.routes';
import adminRoutes from './routes/admin.routes';
import companyRoutes from './routes/company.routes';
import userRoutes from './routes/user.routes';
import superadminRoutes from './routes/superadmin.routes';
import projectRoutes from './routes/project.routes';




app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/rulesets', rulesetRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/projects', projectRoutes);

// Internal diagnostics endpoint for worker status
app.get('/internal/worker-status', async (req, res) => {
  try {
    const { workerStatus } = await import('./worker');
    res.json(workerStatus);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load worker status', detail: String(e) });
  }
});

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});


// Boot sequence: initialize DB, optionally run backfill, then start server and worker.
AppDataSource.initialize()
  .then(async () => {
    console.log('Data Source has been initialized!');
    if (process.env.RUN_PROJECT_SLUG_BACKFILL === '1') {
      try {
        const { backfillProjectSlugs } = await import('./utils/backfill-project-slugs');
        await backfillProjectSlugs();
        console.log('Project slug backfill completed');
      } catch (e) {
        console.error('Project slug backfill failed', e);
      }
    }

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);

      const explicitStart = process.env.START_WORKER_WITH_SERVER === '1' || process.env.RUN_WORKER === '1';
      const inDevAutoStart = process.env.NODE_ENV !== 'production' && process.env.START_WORKER_WITH_SERVER !== '0';
      if (explicitStart || inDevAutoStart) {
        // Start the worker in-process so server+worker run together (suitable for single-instance deployments)
        startWorker().catch((err) => console.error('Failed to start in-process worker:', err));
      }
    });
  })
  .catch((err) => console.error('Error during Data Source initialization:', err));