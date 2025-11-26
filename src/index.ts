import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';

// Config & Utils
import { AppDataSource } from './config/data-source';
import { AppError } from './utils/errors';
import { startWorker } from './worker';

// Routes
import authRoutes from './routes/auth.routes';
import submissionRoutes from './routes/submission.routes';
import rulesetRoutes from './routes/ruleset.routes';
import adminRoutes from './routes/admin.routes';
import companyRoutes from './routes/company.routes';
import userRoutes from './routes/user.routes';
import superadminRoutes from './routes/superadmin.routes';
import projectRoutes from './routes/project.routes';
import aiRoutes from './routes/ai.routes';

// Load environment variables
dotenv.config();

// --- Environment Validation ---
const requiredEnvVars = ['PORT', 'DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
  // In production, you might want to exit: process.exit(1);
}

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// --- Security & Middleware ---
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Request logging

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'https://dev-codetester.web.app',
  process.env.FRONTEND_URL // Allow custom frontend URL from env
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter); // Apply globally to /api routes if needed

// Body Parsing
app.use(express.json({ limit: '50mb' })); // Increased limit for large payloads
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/rulesets', rulesetRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root Endpoint
app.get('/', (req, res) => {
  res.send('Code Checker API is running 🚀');
});

// Internal Diagnostics
app.get('/internal/worker-status', async (req, res) => {
  try {
    const { workerStatus } = await import('./worker');
    res.json(workerStatus);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load worker status', detail: String(e) });
  }
});

// --- Error Handling ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }
  
  console.error('🔥 Unhandled Error:', err);
  res.status(500).json({ 
    status: 'error',
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) 
  });
});

// --- Server Startup ---
const startServer = async () => {
  try {
    // 1. Initialize Database
    await AppDataSource.initialize();
    console.log('✅ Data Source has been initialized!');

    // 2. Run Backfills (if enabled)
    if (process.env.RUN_PROJECT_SLUG_BACKFILL === '1') {
      console.log('🔄 Running project slug backfill...');
      const { backfillProjectSlugs } = await import('./utils/backfill-project-slugs');
      await backfillProjectSlugs();
      console.log('✅ Project slug backfill complete.');
    }

    // 3. Start Worker
    startWorker();
    console.log('👷 Worker started successfully.');

    // 4. Start Express Server
    const server = app.listen(port, () => {
      console.log(`
      ################################################
      🚀 Server listening on port: ${port}
      ################################################
      `);
    });

    // --- Graceful Shutdown ---
    const shutdown = async () => {
      console.log('🛑 SIGTERM/SIGINT received. Shutting down gracefully...');
      
      server.close(() => {
        console.log('zzz HTTP server closed.');
      });

      try {
        await AppDataSource.destroy();
        console.log('zzz Database connection closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Error during startup:', error);
    process.exit(1);
  }
};

startServer();