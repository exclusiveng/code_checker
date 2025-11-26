"use strict";
/**
 * Environment Variables Validation Script
 * Run with: npx ts-node src/validate-env.ts
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
dotenv.config();
const envChecks = [
    // Database
    {
        name: 'DATABASE_URL',
        required: true,
        description: 'PostgreSQL connection URL',
        validator: (val) => val.startsWith('postgres://') || val.startsWith('postgresql://'),
        validationMessage: 'Should start with postgres:// or postgresql://',
    },
    {
        name: 'PORT',
        required: false,
        description: 'Server port',
        defaultValue: '3000',
        validator: (val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) < 65536,
        validationMessage: 'Should be a valid port number (1-65535)',
    },
    // JWT
    {
        name: 'JWT_PRIVATE_KEY',
        required: true,
        description: 'Private key for signing JWTs (RS256)',
        validator: (val) => val.includes('BEGIN PRIVATE KEY') || val.includes('BEGIN RSA PRIVATE KEY'),
        validationMessage: 'Should contain a valid RSA private key',
    },
    {
        name: 'JWT_PUBLIC_KEY',
        required: true,
        description: 'Public key for verifying JWTs (RS256)',
        validator: (val) => val.includes('BEGIN PUBLIC KEY') || val.includes('BEGIN RSA PUBLIC KEY'),
        validationMessage: 'Should contain a valid RSA public key',
    },
    {
        name: 'JWT_EXPIRES_IN',
        required: false,
        description: 'Token expiration time',
        defaultValue: '1d',
    },
    // Redis/Queue
    {
        name: 'REDIS_URL',
        required: false,
        description: 'Redis connection URL (for BullMQ)',
        validator: (val) => val.startsWith('redis://'),
        validationMessage: 'Should start with redis://',
    },
    {
        name: 'USE_IN_MEMORY_QUEUE',
        required: false,
        description: 'Use in-memory queue instead of Redis',
        defaultValue: '1',
        validator: (val) => val === '0' || val === '1',
        validationMessage: 'Should be 0 or 1',
    },
    {
        name: 'START_WORKER_WITH_SERVER',
        required: false,
        description: 'Start BullMQ worker with server',
        defaultValue: '1',
        validator: (val) => val === '0' || val === '1',
        validationMessage: 'Should be 0 or 1',
    },
    // GitHub
    {
        name: 'GITHUB_TOKEN',
        required: false,
        description: 'GitHub personal access token for PR creation',
        validator: (val) => val.startsWith('ghp_') || val.startsWith('github_pat_'),
        validationMessage: 'Should start with ghp_ or github_pat_',
    },
    // AWS S3
    {
        name: 'S3_BUCKET',
        required: true,
        description: 'AWS S3 bucket name for file uploads',
    },
    {
        name: 'AWS_REGION',
        required: true,
        description: 'AWS region for S3 bucket',
    },
    {
        name: 'AWS_ACCESS_KEY_ID',
        required: true,
        description: 'AWS access key ID',
        validator: (val) => val.length >= 16,
        validationMessage: 'Should be at least 16 characters',
    },
    {
        name: 'AWS_SECRET_ACCESS_KEY',
        required: true,
        description: 'AWS secret access key',
        validator: (val) => val.length >= 32,
        validationMessage: 'Should be at least 32 characters',
    },
    // SMTP
    {
        name: 'SMTP_USER',
        required: false,
        description: 'SMTP username for sending emails',
    },
    {
        name: 'SMTP_PASS',
        required: false,
        description: 'SMTP password or app-specific password',
    },
    // AI Configuration (NEW)
    {
        name: 'GOOGLE_GENAI_API_KEY',
        required: true,
        description: '🤖 Google Gemini API key for AI features',
        validator: (val) => val.length > 20,
        validationMessage: 'Should be a valid Gemini API key (get from https://makersuite.google.com/app/apikey)',
    },
    {
        name: 'GENKIT_ENV',
        required: false,
        description: 'Genkit environment',
        defaultValue: 'prod',
        validator: (val) => ['dev', 'prod', 'test'].includes(val),
        validationMessage: 'Should be dev, prod, or test',
    },
    {
        name: 'GENKIT_LOG_LEVEL',
        required: false,
        description: 'Genkit log level',
        defaultValue: 'info',
        validator: (val) => ['debug', 'info', 'warn', 'error'].includes(val),
        validationMessage: 'Should be debug, info, warn, or error',
    },
    // AI Feature Flags (NEW)
    {
        name: 'ENABLE_AI_ANALYSIS',
        required: false,
        description: '🤖 Enable AI-powered code analysis',
        defaultValue: 'true',
        validator: (val) => val === 'true' || val === 'false',
        validationMessage: 'Should be true or false',
    },
    {
        name: 'ENABLE_AI_RULESET_GENERATION',
        required: false,
        description: '🤖 Enable AI ruleset generation (Phase 2)',
        defaultValue: 'false',
        validator: (val) => val === 'true' || val === 'false',
        validationMessage: 'Should be true or false',
    },
    {
        name: 'ENABLE_AI_SEARCH',
        required: false,
        description: '🤖 Enable AI search (Phase 4)',
        defaultValue: 'false',
        validator: (val) => val === 'true' || val === 'false',
        validationMessage: 'Should be true or false',
    },
    {
        name: 'ENABLE_AI_DOCS',
        required: false,
        description: '🤖 Enable AI documentation (Phase 5)',
        defaultValue: 'false',
        validator: (val) => val === 'true' || val === 'false',
        validationMessage: 'Should be true or false',
    },
    // AI Model Configuration (NEW)
    {
        name: 'AI_MODEL',
        required: false,
        description: '🤖 AI model to use',
        defaultValue: 'gemini-1.5-pro',
        validator: (val) => val.startsWith('gemini'),
        validationMessage: 'Should be a Gemini model (e.g., gemini-1.5-pro)',
    },
    {
        name: 'AI_TEMPERATURE',
        required: false,
        description: '🤖 AI temperature (0.0-1.0)',
        defaultValue: '0.7',
        validator: (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 1,
        validationMessage: 'Should be a number between 0.0 and 1.0',
    },
    {
        name: 'AI_MAX_TOKENS',
        required: false,
        description: '🤖 Maximum tokens per AI response',
        defaultValue: '2048',
        validator: (val) => !isNaN(Number(val)) && Number(val) > 0,
        validationMessage: 'Should be a positive number',
    },
    {
        name: 'AI_MAX_REQUESTS_PER_MIN',
        required: false,
        description: '🤖 AI rate limit (requests per minute)',
        defaultValue: '60',
        validator: (val) => !isNaN(Number(val)) && Number(val) > 0,
        validationMessage: 'Should be a positive number',
    },
    {
        name: 'AI_MAX_TOKENS_PER_REQUEST',
        required: false,
        description: '🤖 Maximum tokens per AI request',
        defaultValue: '8000',
        validator: (val) => !isNaN(Number(val)) && Number(val) > 0,
        validationMessage: 'Should be a positive number',
    },
];
function validateEnv() {
    console.log('🔍 Validating Environment Variables...\n');
    const results = {
        valid: [],
        missing: [],
        invalid: [],
        warnings: [],
    };
    envChecks.forEach((check) => {
        const value = process.env[check.name];
        if (!value || value.trim() === '') {
            if (check.required) {
                results.missing.push(check.name);
                console.log(`❌ ${check.name}`);
                console.log(`   Description: ${check.description}`);
                console.log(`   Status: MISSING (Required)\n`);
            }
            else {
                results.warnings.push(check.name);
                console.log(`⚠️  ${check.name}`);
                console.log(`   Description: ${check.description}`);
                console.log(`   Status: Not set (will use default: ${check.defaultValue || 'none'})\n`);
            }
        }
        else {
            // Validate value if validator exists
            if (check.validator && !check.validator(value)) {
                results.invalid.push(check.name);
                console.log(`❌ ${check.name}`);
                console.log(`   Description: ${check.description}`);
                console.log(`   Current Value: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
                console.log(`   Status: INVALID - ${check.validationMessage}\n`);
            }
            else {
                results.valid.push(check.name);
                const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
                const maskedValue = check.name.includes('KEY') || check.name.includes('SECRET') || check.name.includes('PASS')
                    ? '***' + displayValue.slice(-4)
                    : displayValue;
                console.log(`✅ ${check.name}`);
                console.log(`   Description: ${check.description}`);
                console.log(`   Value: ${maskedValue}\n`);
            }
        }
    });
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60) + '\n');
    console.log(`✅ Valid: ${results.valid.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log(`❌ Missing (Required): ${results.missing.length}`);
    console.log(`❌ Invalid: ${results.invalid.length}\n`);
    if (results.missing.length > 0) {
        console.log('🚨 MISSING REQUIRED VARIABLES:');
        results.missing.forEach((name) => {
            const check = envChecks.find((c) => c.name === name);
            console.log(`   - ${name}: ${check?.description}`);
        });
        console.log();
    }
    if (results.invalid.length > 0) {
        console.log('🚨 INVALID VARIABLES:');
        results.invalid.forEach((name) => {
            const check = envChecks.find((c) => c.name === name);
            console.log(`   - ${name}: ${check?.validationMessage}`);
        });
        console.log();
    }
    if (results.warnings.length > 0) {
        console.log('⚠️  OPTIONAL VARIABLES (using defaults):');
        results.warnings.forEach((name) => {
            const check = envChecks.find((c) => c.name === name);
            console.log(`   - ${name}: ${check?.description} (default: ${check?.defaultValue || 'none'})`);
        });
        console.log();
    }
    // AI-specific checks
    console.log('='.repeat(60));
    console.log('🤖 AI FEATURES STATUS');
    console.log('='.repeat(60) + '\n');
    const hasGeminiKey = process.env.GOOGLE_GENAI_API_KEY && process.env.GOOGLE_GENAI_API_KEY.length > 20;
    const aiEnabled = process.env.ENABLE_AI_ANALYSIS === 'true';
    if (hasGeminiKey && aiEnabled) {
        console.log('✅ AI Features: READY');
        console.log(`   Model: ${process.env.AI_MODEL || 'gemini-1.5-pro'}`);
        console.log(`   Temperature: ${process.env.AI_TEMPERATURE || '0.7'}`);
        console.log(`   Max Tokens: ${process.env.AI_MAX_TOKENS || '2048'}`);
    }
    else if (!hasGeminiKey) {
        console.log('❌ AI Features: NOT CONFIGURED');
        console.log('   Missing: GOOGLE_GENAI_API_KEY');
        console.log('   Get your key: https://makersuite.google.com/app/apikey');
    }
    else if (!aiEnabled) {
        console.log('⚠️  AI Features: DISABLED');
        console.log('   Set ENABLE_AI_ANALYSIS=true to enable');
    }
    console.log();
    // Final verdict
    console.log('='.repeat(60));
    if (results.missing.length === 0 && results.invalid.length === 0) {
        console.log('🎉 ALL REQUIRED VARIABLES ARE VALID!');
        console.log('✅ Your .env file is properly configured.');
        console.log('\n📝 Next steps:');
        console.log('   1. Run migration: npm run migrate');
        console.log('   2. Start server: npm run dev');
        if (hasGeminiKey && aiEnabled) {
            console.log('   3. Test AI: npx ts-node src/test-ai.ts');
        }
    }
    else {
        console.log('❌ CONFIGURATION INCOMPLETE');
        console.log('Please fix the issues above before running the application.');
        console.log('\n📚 See AI_ENV_SETUP.md for detailed setup instructions.');
        process.exit(1);
    }
    console.log('='.repeat(60) + '\n');
}
// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ ERROR: .env file not found!');
    console.log('\n📝 Create a .env file in the project root with the required variables.');
    console.log('   See AI_ENV_SETUP.md for a complete list.\n');
    process.exit(1);
}
validateEnv();
