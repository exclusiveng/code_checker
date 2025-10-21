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
import { spawn, fork } from 'child_process';

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


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);

  const startWorker = process.env.START_WORKER_WITH_SERVER === '1' || process.env.RUN_WORKER === '1';
  if (startWorker) {
    try {
      const distWorker = path.join(__dirname, 'worker.js');
      const srcWorker = path.join(__dirname, '..', 'src', 'worker.ts');

      if (fs.existsSync(distWorker)) {
        // Fork the compiled worker (production)
        const child = fork(distWorker, [], { stdio: 'inherit' });
        child.on('exit', (code) => console.log(`Worker process exited with code ${code}`));
      } else if (fs.existsSync(srcWorker)) {
        // Spawn node with ts-node/register to run the TypeScript worker in dev
        const child = spawn(process.execPath, ['-r', 'ts-node/register', srcWorker], { stdio: 'inherit' });
        child.on('exit', (code) => console.log(`Worker (ts) process exited with code ${code}`));
      } else {
        console.warn('Worker entry not found (dist/worker.js or src/worker.ts). Worker not started.');
      }
    } catch (err) {
      console.error('Failed to start worker process with server:', err);
    }
  }
});


AppDataSource.initialize()
  .then(() => console.log('Data Source has been initialized!'))
  .catch((err) => console.error('Error during Data Source initialization:', err));