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
exports.evaluateRulesAgainstZip = evaluateRulesAgainstZip;
const adm_zip_1 = __importDefault(require("adm-zip"));
const axios_1 = __importDefault(require("axios"));
const minimatch_1 = require("minimatch");
const ts = __importStar(require("typescript"));
const ruleset_entity_1 = require("../entities/ruleset.entity");
function matchPaths(globs, filePath) {
    if (!globs || globs.length === 0)
        return true; // no filter means all
    return globs.some((g) => new minimatch_1.Minimatch(g, { matchBase: true, dot: true }).match(filePath));
}
function getTextFilesFromZip(zip) {
    const entries = zip.getEntries();
    const files = [];
    for (const entry of entries) {
        if (entry.isDirectory)
            continue;
        const content = entry.getData().toString('utf8');
        files.push({ path: entry.entryName, content });
    }
    return files;
}
function evaluateFilepatternRule(rule, fileList) {
    const findings = [];
    const payload = rule.payload || {};
    // Normalize payload to handle both legacy and AI formats
    const requireList = payload.require || [];
    const blockList = payload.block || [];
    // Handle AI format: { pattern: string, exists: boolean }
    if (payload.pattern) {
        if (payload.exists === true) {
            requireList.push(payload.pattern);
        }
        else if (payload.exists === false) {
            blockList.push(payload.pattern);
        }
    }
    const allow = payload.allow;
    // required files must exist
    for (const required of requireList) {
        const exists = fileList.some((f) => new minimatch_1.Minimatch(required, { matchBase: true, dot: true }).match(f));
        if (!exists) {
            findings.push({
                ruleId: rule.id,
                severity: rule.severity,
                message: rule.message || `Required file missing: ${required}`,
                locations: [],
            });
        }
    }
    // block patterns not allowed
    if (blockList.length > 0) {
        for (const file of fileList) {
            if (blockList.some((b) => new minimatch_1.Minimatch(b, { matchBase: true, dot: true }).match(file))) {
                findings.push({
                    ruleId: rule.id,
                    severity: rule.severity,
                    message: rule.message || `Blocked file pattern matched: ${file}`,
                    locations: [{ file }],
                });
            }
        }
    }
    // allow list (if provided) means everything must match one of allows
    if (allow && allow.length > 0) {
        for (const file of fileList) {
            const isAllowed = allow.some((a) => new minimatch_1.Minimatch(a, { matchBase: true, dot: true }).match(file));
            if (!isAllowed) {
                findings.push({
                    ruleId: rule.id,
                    severity: rule.severity,
                    message: rule.message || `File not allowed by allowlist: ${file}`,
                    locations: [{ file }],
                });
            }
        }
    }
    return findings;
}
function evaluateContentRule(rule, files) {
    const findings = [];
    const payload = rule.payload || {};
    // Legacy support
    const bannedTokens = payload.banned || payload.patterns || [];
    // AI format support
    const pattern = payload.pattern;
    const flags = payload.flags || 'u';
    const shouldMatch = payload.shouldMatch !== undefined ? payload.shouldMatch : false; // default to false (banned) if not specified
    const paths = payload.paths;
    // options in payload
    const enforceLanguage = payload.language;
    const requireNoEmoji = !!payload.noEmoji;
    const requireSyntaxValid = !!payload.syntax;
    // Prepare regexes
    const regexes = [];
    // Add legacy banned tokens
    for (const token of bannedTokens) {
        try {
            regexes.push({ regex: new RegExp(token, 'u'), shouldMatch: false });
        }
        catch (e) {
            console.error(`Invalid regex in rule ${rule.id}: ${token}`, e);
        }
    }
    // Add AI pattern
    if (pattern) {
        try {
            regexes.push({ regex: new RegExp(pattern, flags), shouldMatch: shouldMatch });
        }
        catch (e) {
            console.error(`Invalid regex in rule ${rule.id}: ${pattern}`, e);
        }
    }
    for (const file of files) {
        if (!matchPaths(paths, file.path))
            continue;
        const ext = (file.path.split('.').pop() || 'unknown').toLowerCase();
        // language enforcement by file extension
        if (enforceLanguage) {
            const langMap = {
                js: ['js', 'mjs', 'cjs'],
                ts: ['ts', 'tsx'],
                py: ['py'],
                cpp: ['cpp', 'cc', 'cxx', 'c++'],
                c: ['c'],
            };
            const allowedExts = langMap[enforceLanguage] || [enforceLanguage];
            if (!allowedExts.includes(ext)) {
                findings.push({
                    ruleId: rule.id,
                    severity: rule.severity,
                    message: rule.message || `File ${file.path} does not match required language ${enforceLanguage}`,
                    locations: [{ file: file.path }],
                });
            }
        }
        // emoji detection
        if (requireNoEmoji) {
            try {
                const emojiRe = /\p{Extended_Pictographic}/u;
                if (emojiRe.test(file.content)) {
                    findings.push({
                        ruleId: rule.id,
                        severity: rule.severity,
                        message: rule.message || `Emoji content detected in ${file.path}`,
                        locations: [{ file: file.path }],
                    });
                }
            }
            catch (e) {
                const fallback = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}]/u;
                if (fallback.test(file.content)) {
                    findings.push({
                        ruleId: rule.id,
                        severity: rule.severity,
                        message: rule.message || `Emoji content detected in ${file.path}`,
                        locations: [{ file: file.path }],
                    });
                }
            }
        }
        // syntax checks for JS/TS
        if (requireSyntaxValid) {
            if (['js', 'mjs', 'cjs', 'ts', 'tsx'].includes(ext)) {
                try {
                    const transpile = ts.transpileModule(file.content, {
                        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
                        reportDiagnostics: true,
                    });
                    const diags = transpile.diagnostics || [];
                    if (diags.length > 0) {
                        const msg = ts.flattenDiagnosticMessageText(diags[0].messageText, '\n');
                        findings.push({
                            ruleId: rule.id,
                            severity: rule.severity,
                            message: rule.message || `Syntax error in ${file.path}: ${msg}`,
                            locations: [{ file: file.path }],
                        });
                    }
                }
                catch (e) {
                    findings.push({
                        ruleId: rule.id,
                        severity: rule.severity,
                        message: rule.message || `Syntax validation failed for ${file.path}`,
                        locations: [{ file: file.path }],
                    });
                }
            }
        }
        // Regex checks (both banned and required)
        const lines = file.content.split(/\r?\n/);
        for (const { regex, shouldMatch } of regexes) {
            if (shouldMatch) {
                // Required content: must exist somewhere in the file
                if (!regex.test(file.content)) {
                    findings.push({
                        ruleId: rule.id,
                        severity: rule.severity,
                        message: rule.message || `Required pattern not found: ${regex.source}`,
                        locations: [{ file: file.path }],
                    });
                }
            }
            else {
                // Banned content: must NOT exist
                // Check line by line for better reporting
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (regex.test(line)) {
                        findings.push({
                            ruleId: rule.id,
                            severity: rule.severity,
                            message: rule.message || `Banned content matched: ${regex.source}`,
                            locations: [{ file: file.path, line: i + 1, excerpt: line.slice(0, 200) }],
                        });
                        // Break after first match in file to avoid spamming findings for the same rule
                        break;
                    }
                }
            }
        }
    }
    return findings;
}
async function evaluateRulesAgainstZip(zipPathOrUrl, rules) {
    const evaluatableRules = rules.filter(r => r.type === ruleset_entity_1.RuleType.CONTENT || r.type === ruleset_entity_1.RuleType.FILE_PATTERN);
    if (evaluatableRules.length === 0) {
        console.warn('No evaluatable rules (CONTENT or FILE_PATTERN) found in the provided rulesets.');
        return {
            findings: [{
                    ruleId: 'system-error',
                    severity: ruleset_entity_1.RuleSeverity.ERROR,
                    message: 'No evaluatable rules (e.g., CONTENT or FILE_PATTERN) were found for this project. Analysis cannot proceed.',
                    locations: [],
                }],
            hasErrors: true,
        };
    }
    let zip;
    if (/^https?:\/\//i.test(zipPathOrUrl)) {
        const resp = await axios_1.default.get(zipPathOrUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(resp.data);
        zip = new adm_zip_1.default(buffer);
    }
    else {
        zip = new adm_zip_1.default(zipPathOrUrl);
    }
    const textFiles = getTextFilesFromZip(zip);
    const fileList = textFiles.map((f) => f.path);
    const findings = [];
    // filepattern first
    for (const rule of rules.filter((r) => r.type === ruleset_entity_1.RuleType.FILE_PATTERN)) {
        findings.push(...evaluateFilepatternRule(rule, fileList));
    }
    // content next
    for (const rule of rules.filter((r) => r.type === ruleset_entity_1.RuleType.CONTENT)) {
        findings.push(...evaluateContentRule(rule, textFiles));
    }
    const hasErrors = findings.some((f) => f.severity === ruleset_entity_1.RuleSeverity.ERROR);
    return { findings, hasErrors };
}
