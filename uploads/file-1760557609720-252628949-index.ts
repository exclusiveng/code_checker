import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import { AppDataSource } from './config/data-source';
import authRoutes from './routes/auth.routes';
import { AppError } from './utils/errors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

import bodyParser from 'body-parser';

app.use(limiter);
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


app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/rulesets', rulesetRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/superadmin', superadminRoutes);

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

// Start server immediately so API routes can be tested even if DB/Redis are not available in dev.
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Initialize DB in background and log status.
AppDataSource.initialize()
  .then(() => console.log('Data Source has been initialized!'))
  .catch((err) => console.error('Error during Data Source initialization:', err));