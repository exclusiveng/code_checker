import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileJson, FileText, ChevronDown, Check } from 'lucide-react';
import { RuleInput } from './RulesetEditor';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: RuleInput) => void;
  rule: RuleInput | null;
  defaultRule: RuleInput;
}

const ruleTemplates: Array<{ name: string; rule: Omit<RuleInput, 'id'> }> = [
  // Custom empty rule
  {
    name: 'Custom Rule',
    rule: {
      type: 'filepattern',
      payload: '',
      severity: 'warning',
      message: '',
    },
  },

  // File presence rules
  {
    name: 'Enforce README.md file',
    rule: {
      type: 'filepattern',
      payload: { require: ['README.md'] },
      severity: 'warning',
      message: 'A README.md file is missing from the project root.',
    },
  },
  {
    name: 'Enforce package.json file',
    rule: {
      type: 'filepattern',
      payload: { require: ['package.json'] },
      severity: 'error',
      message: 'package.json is required for project dependency management.',
    },
  },
  {
    name: 'Enforce .gitignore presence',
    rule: {
      type: 'filepattern',
      payload: { require: ['.gitignore'] },
      severity: 'warning',
      message: '.gitignore file is missing, which may expose sensitive files.',
    },
  },

  // Block unwanted files
  {
    name: 'Block .env files from being committed',
    rule: {
      type: 'filepattern',
      payload: { block: ['**/.env'] },
      severity: 'error',
      message: 'Environment file (.env) should not be committed to the repository.',
    },
  },
  {
    name: 'Block node_modules directory',
    rule: {
      type: 'filepattern',
      payload: { block: ['**/node_modules/**'] },
      severity: 'warning',
      message: 'node_modules should not be committed to the repository.',
    },
  },
  {
    name: 'Block build/dist folders',
    rule: {
      type: 'filepattern',
      payload: { block: ['dist/**', 'build/**'] },
      severity: 'warning',
      message: 'Build artifacts should not be committed.',
    },
  },

  // Content rules
  {
    name: 'Discourage `console.log` statements',
    rule: {
      type: 'content',
      payload: {
        banned: ['console\\.log'],
        paths: ['src/**/*.ts', 'src/**/*.js'],
        syntax: true,
        language: 'ts',
      },
      severity: 'warning',
      message: "Found 'console.log' statement. Consider removing for production.",
    },
  },
  {
    name: 'Disallow TODO comments in code',
    rule: {
      type: 'content',
      payload: {
        banned: ['TODO'],
        paths: ['src/**/*.ts', 'src/**/*.js'],
        syntax: true,
        language: 'ts',
      },
      severity: 'warning',
      message: "TODO comments should be resolved before production.",
    },
  },
  {
    name: 'Disallow emoji in code',
    rule: {
      type: 'content',
      payload: {
        noEmoji: true,
        paths: ['src/**/*.ts', 'src/**/*.js'],
        syntax: true,
        language: 'ts',
      },
      severity: 'warning',
      message: 'Emoji detected in code, which may break parsers or linters.',
    },
  },
  {
    name: 'Require function comments / documentation',
    rule: {
      type: 'content',
      payload: {
        banned: ['function\\s+\\w+\\('],
        paths: ['src/**/*.ts', 'src/**/*.js'],
        syntax: true,
        language: 'ts',
      },
      severity: 'warning',
      message: 'Ensure all functions have comments/documentation.',
    },
  },

  // Additional file patterns
  {
    name: 'Enforce LICENSE file',
    rule: {
      type: 'filepattern',
      payload: { require: ['LICENSE'] },
      severity: 'warning',
      message: 'LICENSE file missing from project root.',
    },
  },
  {
    name: 'Enforce .editorconfig file',
    rule: {
      type: 'filepattern',
      payload: { require: ['.editorconfig'] },
      severity: 'warning',
      message: '.editorconfig file missing, code style may be inconsistent.',
    },
  },
  {
    name: 'Enforce .prettierrc file',
    rule: {
      type: 'filepattern',
      payload: { require: ['.prettierrc', '.prettierrc.json'] },
      severity: 'warning',
      message: 'Prettier configuration file missing.',
    },
  },
];


const getTemplateForRule = (rule: RuleInput): typeof ruleTemplates[0] => {
  return ruleTemplates.find(t => t.rule.message === rule.message && t.rule.type === rule.type) || ruleTemplates[0];
};

export const RuleModal: React.FC<RuleModalProps> = ({ isOpen, onClose, onSave, rule, defaultRule }) => {
  const [currentRule, setCurrentRule] = useState<RuleInput | null>(null);
  const [payloadStr, setPayloadStr] = useState<string>('');
  const [requiredStr, setRequiredStr] = useState<string>('');
  const [blockedStr, setBlockedStr] = useState<string>('');
  const [pathsStr, setPathsStr] = useState<string>('');
  const [bannedStr, setBannedStr] = useState<string>('');
  const [requireSyntax, setRequireSyntax] = useState<boolean>(false);
  const [noEmoji, setNoEmoji] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(ruleTemplates[0]);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isNewRule = !rule;

  useEffect(() => {
    if (isOpen) {
      if (isNewRule) {
        setCurrentRule({ ...defaultRule });
        setPayloadStr('');
        setRequiredStr('');
        setBlockedStr('');
        setPathsStr('');
        setBannedStr('');
        setRequireSyntax(false);
        setNoEmoji(false);
        setErrorMessage(null);
        setSelectedTemplate(ruleTemplates[0]);
      } else if (rule) {
        setCurrentRule({ ...rule });
        // populate helper fields from payload when editing
        const p = rule.payload;
        if (!p) {
          setRequiredStr('');
          setBlockedStr('');
          setPathsStr('');
          setBannedStr('');
          setRequireSyntax(false);
          setNoEmoji(false);
        } else if (typeof p === 'string') {
          // treat string as simple banned/pattern
          setBannedStr(p);
        } else if (typeof p === 'object') {
          setRequiredStr((p.require && p.require[0]) || '');
          setBlockedStr((p.block && p.block[0]) || '');
          setPathsStr((p.paths && p.paths[0]) || '');
          setBannedStr((p.banned && p.banned[0]) || (p.patterns && p.patterns[0]) || '');
          setRequireSyntax(!!p.syntax);
          setNoEmoji(!!p.noEmoji);
        }
        setSelectedTemplate(getTemplateForRule(rule));
      }
    } else {
      setCurrentRule(null);
      setPayloadStr('');
    }
  }, [isOpen, rule, isNewRule, defaultRule]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTemplateDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (field: keyof Omit<RuleInput, 'id'>, value: string) => {
    if (!currentRule) return;
    setCurrentRule({ ...currentRule, [field]: value } as RuleInput);
    setErrorMessage(null);
    setSelectedTemplate(ruleTemplates[0]); // Mark as custom
  };

  const handleTemplateChange = (templateName: string) => {
    const template = ruleTemplates.find(t => t.name === templateName) || ruleTemplates[0];
    setSelectedTemplate(template);
    setIsTemplateDropdownOpen(false);

    const newRule = { ...(rule || defaultRule), ...template.rule };
    setCurrentRule(newRule);

    // Reset all derived state fields first
    setRequiredStr('');
    setBlockedStr('');
    setPathsStr('');
    setBannedStr('');
    setRequireSyntax(false);
    setNoEmoji(false);

    // Populate derived state from the new payload
    const p = newRule.payload;
    if (typeof p === 'object' && p !== null) {
      // filepattern fields
      if ('require' in p && Array.isArray(p.require)) setRequiredStr(p.require.join(', '));
      if ('block' in p && Array.isArray(p.block)) setBlockedStr(p.block.join(', '));
      // content fields
      if ('banned' in p && Array.isArray(p.banned)) setBannedStr(p.banned.join(', '));
      if ('paths' in p && Array.isArray(p.paths)) setPathsStr(p.paths.join(', '));
      if ('syntax' in p) setRequireSyntax(!!p.syntax);
      if ('noEmoji' in p) setNoEmoji(!!p.noEmoji);
    }
  };

  const parsePayload = (s: string): string | Record<string, any> => {
    const trimmed = s?.trim();
    if (!trimmed) return '';
    // If looks like JSON, try parse
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        // fall through to return string
      }
    }
    return s;
  };

  const handleSave = () => {
    if (!currentRule) return;
    // Basic validation: ensure rule has at least one actionable value
    if (currentRule.type === 'filepattern' && !requiredStr && !blockedStr) {
      setErrorMessage('Please enter a required file or blocked pattern');
      return;
    }
    if (currentRule.type === 'content' && !bannedStr) {
      setErrorMessage('Please enter a banned pattern');
      return;
    }
    // Ensure message is provided
    if (!currentRule.message || !currentRule.message.trim()) {
      setErrorMessage('Please enter a message/description for this rule');
      return;
    }

    let finalPayload: string | Record<string, any> = '';
    if (currentRule.type === 'filepattern') {
      finalPayload = {} as Record<string, any>;
      if (requiredStr) finalPayload.require = [requiredStr];
      if (blockedStr) finalPayload.block = [blockedStr];
    } else if (currentRule.type === 'content') {
      finalPayload = {} as Record<string, any>;
      if (bannedStr) finalPayload.banned = [bannedStr];
      if (pathsStr) finalPayload.paths = [pathsStr];
      if (requireSyntax) finalPayload.syntax = true;
      if (noEmoji) finalPayload.noEmoji = true;
    } else {
      finalPayload = parsePayload(payloadStr);
    }

    const merged: RuleInput = { ...currentRule, payload: finalPayload } as RuleInput;
    const ruleToSave: RuleInput = isNewRule ? { ...merged, id: crypto.randomUUID() } : merged;
    setErrorMessage(null);
    onSave(ruleToSave);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {isNewRule ? 'Add New Rule' : 'Edit Rule'}
              </h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>

            {currentRule && (
              <div className="space-y-4">
                {isNewRule && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Rule Template</label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                        className="w-full flex justify-between items-center border border-gray-300 rounded-lg p-2 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:outline-none text-left"
                      >
                        <span>{selectedTemplate.name}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isTemplateDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isTemplateDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                          >
                            {ruleTemplates.map(t => (
                              <button
                                key={t.name}
                                type="button"
                                onClick={() => handleTemplateChange(t.name)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center justify-between"
                              >
                                <span>{t.name}</span>
                                {selectedTemplate.name === t.name && (
                                  <Check className="w-4 h-4 text-blue-600" />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {isNewRule && <hr className="border-gray-200" />}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleChange('type', 'filepattern')}
                        className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded-lg text-sm transition-all ${currentRule.type === 'filepattern' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <FileJson size={14} /> File pattern
                      </button>
                      <button
                        onClick={() => handleChange('type', 'content')}
                        className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded-lg text-sm transition-all ${currentRule.type === 'content' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <FileText size={14} /> Content
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Severity</label>
                    <select
                      value={currentRule.severity}
                      onChange={(e) => handleChange('severity', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                </div>
                <div>
                  {currentRule.type === 'filepattern' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Required file or glob</label>
                      <input
                        type="text"
                        value={requiredStr}
                        onChange={(e) => setRequiredStr(e.target.value)}
                        placeholder="e.g. package.json or src/**/*.ts"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2"
                      />

                      <label className="block text-sm font-medium text-gray-600 mb-1">Blocked pattern (optional)</label>
                      <input
                        type="text"
                        value={blockedStr}
                        onChange={(e) => setBlockedStr(e.target.value)}
                        placeholder="e.g. **/*.env"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2"
                      />

                      <p className="text-sm text-gray-500">This will ensure the required file exists and optionally block specific patterns.</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Pattern to ban (simple regex)</label>
                      <input
                        type="text"
                        value={bannedStr}
                        onChange={(e) => setBannedStr(e.target.value)}
                        placeholder="e.g. console\.log or TODO"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2"
                      />

                      <label className="block text-sm font-medium text-gray-600 mb-1">Limit to paths (glob, optional)</label>
                      <input
                        type="text"
                        value={pathsStr}
                        onChange={(e) => setPathsStr(e.target.value)}
                        placeholder="e.g. src/**/*.ts"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2"
                      />

                      <div className="flex items-center gap-4 mt-1">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={requireSyntax} onChange={(e) => setRequireSyntax(e.target.checked)} />
                          <span className="text-xs text-gray-600">Require valid syntax</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={noEmoji} onChange={(e) => setNoEmoji(e.target.checked)} />
                          <span className="text-xs text-gray-600">Disallow emoji</span>
                        </label>
                      </div>

                      <p className="text-sm text-gray-500 mt-2">Enter a single banned pattern (regex). Use the path field to narrow the check to specific files.</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Message</label>
                  <input
                    type="text"
                    value={currentRule.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="Description of the rule's purpose"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mt-4 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Rule</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};