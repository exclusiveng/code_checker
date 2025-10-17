import AdmZip from 'adm-zip';
import axios from 'axios';
import { Minimatch } from 'minimatch';
import * as ts from 'typescript';
import { Rule, RuleSeverity, RuleType } from '../entities/ruleset.entity';

export interface RuleFinding {
  ruleId: string;
  severity: RuleSeverity;
  message: string;
  locations: { file: string; line?: number; excerpt?: string }[];
}

export interface RuleEvaluationResult {
  findings: RuleFinding[];
  hasErrors: boolean;
}

function matchPaths(globs: string[] | undefined, filePath: string): boolean {
  if (!globs || globs.length === 0) return true; // no filter means all
  return globs.some((g) => new Minimatch(g, { matchBase: true, dot: true }).match(filePath));
}

function getTextFilesFromZip(zip: any): { path: string; content: string }[] {
  const entries = zip.getEntries();
  const files: { path: string; content: string }[] = [];
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    // Read as text; if binary, may produce garbage but regex/content checks are text-first.
    const content = entry.getData().toString('utf8');
    files.push({ path: entry.entryName, content });
  }
  return files;
}

function evaluateFilepatternRule(rule: Rule, fileList: string[]): RuleFinding[] {
  const findings: RuleFinding[] = [];
  const payload = rule.payload || {};
  const requireList: string[] = payload.require || [];
  const allow: string[] | undefined = payload.allow;
  const block: string[] | undefined = payload.block;

  // required files must exist
  for (const required of requireList) {
    const exists = fileList.some((f) => new Minimatch(required, { matchBase: true, dot: true }).match(f));
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
  if (block && block.length > 0) {
    for (const file of fileList) {
      if (block.some((b) => new Minimatch(b, { matchBase: true, dot: true }).match(file))) {
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
      const isAllowed = allow.some((a) => new Minimatch(a, { matchBase: true, dot: true }).match(file));
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

function evaluateContentRule(rule: Rule, files: { path: string; content: string }[]): RuleFinding[] {
  const findings: RuleFinding[] = [];
  const payload = rule.payload || {};
  const tokens: string[] = payload.banned || payload.patterns || [];
  const paths: string[] | undefined = payload.paths;

  // options in payload
  const enforceLanguage: string | undefined = payload.language; // e.g. 'ts', 'js', 'cpp'
  const requireNoEmoji: boolean = !!payload.noEmoji;
  const requireSyntaxValid: boolean = !!payload.syntax;

  const regexes = tokens.map((t) => {
    try {
      return new RegExp(t, 'u');
    } catch {
      return null;
    }
  }).filter((r): r is RegExp => !!r);

  for (const file of files) {
    if (!matchPaths(paths, file.path)) continue;
    
    const ext = (file.path.split('.').pop() || 'unknown').toLowerCase();
    console.log(`Evaluating file: ${file.path} (detected language/extension: ${ext})`);

    // language enforcement by file extension
    if (enforceLanguage) {
      const langMap: Record<string, string[]> = {
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
        // continue to other checks as well
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
      } catch (e) {
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
        } catch (e) {
          findings.push({
            ruleId: rule.id,
            severity: rule.severity,
            message: rule.message || `Syntax validation failed for ${file.path}`,
            locations: [{ file: file.path }],
          });
        }
      }
    }

    // line-by-line banned patterns
    const lines = file.content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const re of regexes) {
        if (re.test(line)) {
          findings.push({
            ruleId: rule.id,
            severity: rule.severity,
            message: rule.message || `Banned content matched`,
            locations: [{ file: file.path, line: i + 1, excerpt: line.slice(0, 200) }],
          });
          break;
        }
      }
    }
  }

  return findings;
}

export async function evaluateRulesAgainstZip(zipPathOrUrl: string, rules: Rule[]): Promise<RuleEvaluationResult> {
  const evaluatableRules = rules.filter(r => r.type === RuleType.CONTENT || r.type === RuleType.FILE_PATTERN);

  if (evaluatableRules.length === 0) {
    console.warn('No evaluatable rules (CONTENT or FILE_PATTERN) found in the provided rulesets.');
    return {
      findings: [{
        ruleId: 'system-error',
        severity: RuleSeverity.ERROR,
        message: 'No evaluatable rules (e.g., CONTENT or FILE_PATTERN) were found for this project. Analysis cannot proceed.',
        locations: [],
      }],
      hasErrors: true,
    };
  }

  let zip: any;
  if (/^https?:\/\//i.test(zipPathOrUrl)) {
    const resp = await axios.get<ArrayBuffer>(zipPathOrUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(resp.data);
    zip = new AdmZip(buffer);
  } else {
    zip = new AdmZip(zipPathOrUrl);
  }
  const textFiles = getTextFilesFromZip(zip);
  const fileList = textFiles.map((f) => f.path);

  const findings: RuleFinding[] = [];

  // filepattern first
  for (const rule of rules.filter((r) => r.type === RuleType.FILE_PATTERN)) {
    findings.push(...evaluateFilepatternRule(rule, fileList));
  }

  // content next
  for (const rule of rules.filter((r) => r.type === RuleType.CONTENT)) {
    findings.push(...evaluateContentRule(rule, textFiles));
  }

  const hasErrors = findings.some((f) => f.severity === RuleSeverity.ERROR);
  return { findings, hasErrors };
}
