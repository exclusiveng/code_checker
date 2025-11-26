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
Object.defineProperty(exports, "__esModule", { value: true });
exports.gemini15Pro = exports.gemini20Flash = exports.AI_CONFIG = exports.ai = void 0;
const genkit_1 = require("genkit");
const googleai_1 = require("@genkit-ai/googleai");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
/**
 * Configure Genkit with Google AI (Gemini)
 * This is the central configuration for all AI features
 */
exports.ai = (0, genkit_1.genkit)({
    plugins: [
        (0, googleai_1.googleAI)({
            apiKey: process.env.GOOGLE_GENAI_API_KEY,
        }),
    ],
    model: googleai_1.gemini20Flash, // Using Gemini 2.0 Flash - latest model
});
/**
 * AI Configuration Constants
 */
exports.AI_CONFIG = {
    model: process.env.AI_MODEL || 'gemini-2.0-flash',
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2048'),
    // Feature flags
    features: {
        analysis: process.env.ENABLE_AI_ANALYSIS === 'true',
        rulesetGeneration: process.env.ENABLE_AI_RULESET_GENERATION === 'true',
        search: process.env.ENABLE_AI_SEARCH === 'true',
        documentation: process.env.ENABLE_AI_DOCS === 'true',
    },
    // Cost control
    maxRequestsPerMinute: parseInt(process.env.AI_MAX_REQUESTS_PER_MIN || '60'),
    maxTokensPerRequest: parseInt(process.env.AI_MAX_TOKENS_PER_REQUEST || '8000'),
};
// Export the model for use in flows
var googleai_2 = require("@genkit-ai/googleai");
Object.defineProperty(exports, "gemini20Flash", { enumerable: true, get: function () { return googleai_2.gemini20Flash; } });
exports.gemini15Pro = googleai_1.gemini20Flash; // Alias for compatibility
exports.default = exports.ai;
