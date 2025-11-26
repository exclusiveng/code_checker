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
const data_source_1 = require("./config/data-source");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const errors_1 = require("./utils/errors");
const cors_1 = __importDefault(require("cors"));
dotenv.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
const body_parser_1 = __importDefault(require("body-parser"));
const worker_1 = require("./worker");
// --- CORS Configuration ---
// Allow requests from your React frontend development server
const corsOptions = {
    origin: 'http://localhost:5173',
    optionsSuccessStatus: 200, // For legacy browser support
};
app.use((0, cors_1.default)(corsOptions));
// app.use(limiter);
// Parse JSON bodies
app.use(express_1.default.json());
// Parse urlencoded bodies (form submissions)
app.use(body_parser_1.default.urlencoded({ extended: true }));
const submission_routes_1 = __importDefault(require("./routes/submission.routes"));
const ruleset_routes_1 = __importDefault(require("./routes/ruleset.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const company_routes_1 = __importDefault(require("./routes/company.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const superadmin_routes_1 = __importDefault(require("./routes/superadmin.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/submissions', submission_routes_1.default);
app.use('/api/rulesets', ruleset_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/companies', company_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/superadmin', superadmin_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.get('/', (req, res) => {
    res.send('Hello, World!');
});
app.use((err, req, res, next) => {
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({
            message: err.message,
        });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    const explicitStart = process.env.START_WORKER_WITH_SERVER === '1' || process.env.RUN_WORKER === '1';
    const inDevAutoStart = process.env.NODE_ENV !== 'production' && process.env.START_WORKER_WITH_SERVER !== '0';
    if (explicitStart || inDevAutoStart) {
        // Start the worker in-process so server+worker run together (suitable for single-instance deployments)
        (0, worker_1.startWorker)().catch((err) => console.error('Failed to start in-process worker:', err));
    }
});
data_source_1.AppDataSource.initialize()
    .then(() => console.log('Data Source has been initialized!'))
    .catch((err) => console.error('Error during Data Source initialization:', err));
