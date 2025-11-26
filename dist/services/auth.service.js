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
exports.verifyToken = exports.signToken = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const keys_1 = require("../utils/keys");
let PRIVATE_KEY = (0, keys_1.loadPrivateKey)();
let PUBLIC_KEYS = (0, keys_1.loadPublicKeys)();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const signToken = (user) => {
    if (!PRIVATE_KEY) {
        throw new Error('Private key not configured for JWT signing (JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_PATH)');
    }
    const payload = {
        id: user.id,
        role: user.role,
    };
    const key = PRIVATE_KEY;
    return jwt.sign(payload, key, { algorithm: 'RS256', expiresIn: JWT_EXPIRES_IN });
};
exports.signToken = signToken;
// Verify against multiple public keys (rotation support)
const verifyToken = (token) => {
    for (const pub of PUBLIC_KEYS) {
        try {
            const key = pub;
            const decoded = jwt.verify(token, key, { algorithms: ['RS256'] });
            return decoded;
        }
        catch (err) {
        }
    }
    return null;
};
exports.verifyToken = verifyToken;
