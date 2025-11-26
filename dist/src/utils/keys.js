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
exports.loadPrivateKey = loadPrivateKey;
exports.loadPublicKeys = loadPublicKeys;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Simple key loader for RS256 keys. Keys may be provided via env pointing to files
// or inline PEM strings. Supports rotation by allowing multiple public keys in CSV.
function loadPrivateKey() {
    const keyPath = process.env.JWT_PRIVATE_KEY_PATH;
    const inline = process.env.JWT_PRIVATE_KEY;
    if (inline)
        return inline;
    if (keyPath) {
        try {
            const full = path.resolve(keyPath);
            return fs.readFileSync(full, 'utf8');
        }
        catch (err) {
            console.error('Failed to load private key:', err);
            return null;
        }
    }
    return null;
}
function loadPublicKeys() {
    // Support multiple environment variable names for flexibility
    const csv = process.env.JWT_PUBLIC_KEYS || process.env.JWT_PUBLIC_KEY || process.env.JWT_PUBLIC_KEYS_PATHS || process.env.JWT_PUBLIC_KEY_PATHS || '';
    const keys = [];
    if (!csv)
        return keys;
    // CSV may contain file paths or inline PEMs separated by ||
    const parts = csv.split('||').map(p => p.trim()).filter(Boolean);
    parts.forEach(p => {
        // if looks like a path
        if (p.startsWith('/') || p.startsWith('./') || p.startsWith('../') || p.match(/^[A-Za-z]:\\/)) {
            try {
                keys.push(fs.readFileSync(path.resolve(p), 'utf8'));
            }
            catch (err) {
                console.error('Failed to load public key from path', p, err);
            }
        }
        else {
            keys.push(p);
        }
    });
    return keys;
}
