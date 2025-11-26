"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const body_parser_1 = __importDefault(require("body-parser"));
// Config & Utils
const data_source_1 = require("./config/data-source");
const errors_1 = require("./utils/errors");
const worker_1 = require("./worker");
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const submission_routes_1 = __importDefault(require("./routes/submission.routes"));
const ruleset_routes_1 = __importDefault(require("./routes/ruleset.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const company_routes_1 = __importDefault(require("./routes/company.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const superadmin_routes_1 = __importDefault(require("./routes/superadmin.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
// Load environment variables
dotenv.config();
// --- Environment Validation ---
const requiredEnvVars = ['PORT', 'DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
    console.warn(`⚠️  Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
    // In production, you might want to exit: process.exit(1);
}
const app = (0, express_1.default)();
const port = parseInt(process.env.PORT || '3000', 10);
// --- Security & Middleware ---
app.use((0, helmet_1.default)()); // Security headers
app.use((0, morgan_1.default)('dev')); // Request logging
// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'https://dev-codetester.web.app',
    process.env.FRONTEND_URL // Allow custom frontend URL from env
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn(`Blocked CORS request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));
// Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter); // Apply globally to /api routes if needed
// Body Parsing
app.use(express_1.default.json({ limit: '50mb' })); // Increased limit for large payloads
app.use(body_parser_1.default.urlencoded({ extended: true, limit: '50mb' }));
// --- Routes ---
app.use('/api/auth', auth_routes_1.default);
app.use('/api/submissions', submission_routes_1.default);
app.use('/api/rulesets', ruleset_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/companies', company_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/superadmin', superadmin_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
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
        const { workerStatus } = await Promise.resolve().then(() => __importStar(require('./worker')));
        res.json(workerStatus);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to load worker status', detail: String(e) });
    }
});
// --- Error Handling ---
app.use((err, req, res, next) => {
    if (err instanceof errors_1.AppError) {
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
        await data_source_1.AppDataSource.initialize();
        console.log('✅ Data Source has been initialized!');
        // 2. Run Backfills (if enabled)
        if (process.env.RUN_PROJECT_SLUG_BACKFILL === '1') {
            console.log('🔄 Running project slug backfill...');
            const { backfillProjectSlugs } = await Promise.resolve().then(() => __importStar(require('./utils/backfill-project-slugs')));
            await backfillProjectSlugs();
            console.log('✅ Project slug backfill complete.');
        }
        // 3. Start Worker
        (0, worker_1.startWorker)();
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
                await data_source_1.AppDataSource.destroy();
                console.log('zzz Database connection closed.');
                process.exit(0);
            }
            catch (err) {
                console.error('Error during shutdown:', err);
                process.exit(1);
            }
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (error) {
        console.error('❌ Error during startup:', error);
        process.exit(1);
    }
};
startServer();
