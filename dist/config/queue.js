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
exports.subscribeInMemorySubmissionProcessor = subscribeInMemorySubmissionProcessor;
exports.getSubmissionQueue = getSubmissionQueue;
const bullmq_1 = require("bullmq");
const dotenv = __importStar(require("dotenv"));
const crypto_1 = require("crypto");
dotenv.config();
// If you set USE_IN_MEMORY_QUEUE=1 we use a lightweight in-process queue which
// keeps jobs in memory and not require Redis. This is meant for single-process
// deployments (server+worker in same process) and is NOT suitable for multi-
// instance production setups.
let _submissionQueue = null;
let _inMemoryListeners = [];
class InMemoryQueue {
    async add(name, data) {
        const job = { id: (0, crypto_1.randomUUID)(), name, data };
        // schedule delivery on next tick so caller doesn't block
        setImmediate(() => {
            for (const l of _inMemoryListeners) {
                l(job).catch((err) => console.error('InMemoryQueue job handler error', err));
            }
        });
        return job;
    }
}
function subscribeInMemorySubmissionProcessor(fn) {
    _inMemoryListeners.push(fn);
}
function getSubmissionQueue() {
    if (_submissionQueue)
        return _submissionQueue;
    // If the user explicitly requests the in-memory queue OR no Redis config is
    // provided, use the in-memory queue. This prevents accidental attempts to
    // connect to localhost:6379 when Redis isn't intended to be used.
    const hasRedisConfig = !!process.env.REDIS_HOST || !!process.env.REDIS_URL || !!process.env.REDIS_PORT;
    const forceInMemory = process.env.USE_IN_MEMORY_QUEUE === '1';
    if (forceInMemory || !hasRedisConfig) {
        _submissionQueue = new InMemoryQueue();
        return _submissionQueue;
    }
    // Use BullMQ Queue (requires Redis) when explicit Redis config is present
    const connection = process.env.REDIS_URL
        ? { url: process.env.REDIS_URL }
        : {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
        };
    _submissionQueue = new bullmq_1.Queue('submission-analysis', { connection });
    return _submissionQueue;
}
