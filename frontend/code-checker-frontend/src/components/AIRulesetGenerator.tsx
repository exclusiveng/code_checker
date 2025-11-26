import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/api';

interface AIRulesetGeneratorProps {
  onRulesetGenerated: (ruleset: any, templateId?: string) => void;
  projectId?: string;
}

export const AIRulesetGenerator: React.FC<AIRulesetGeneratorProps> = ({
  onRulesetGenerated,
  projectId,
}) => {
  const [prompt, setPrompt] = useState('');
  const [strictness, setStrictness] = useState<'strict' | 'moderate' | 'lenient'>('moderate');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description of the rules you want');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.post('/ai/rulesets/generate', {
        prompt: prompt.trim(),
        projectId,
        strictness,
        saveAsTemplate,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onRulesetGenerated(
            response.data.data.ruleset,
            response.data.data.template?.id
          );
        }, 800);
      }
    } catch (err: any) {
      console.error('Failed to generate ruleset:', err);
      setError(err.response?.data?.message || 'Failed to generate ruleset. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const examplePrompts = [
    'Create strict TypeScript rules for a React project. Require proper typing and forbid any types.',
    'Generate security rules for a web application. Ban eval(), require HTTPS, and forbid hardcoded secrets.',
    'Enforce team coding standards: max 300 lines per file, require JSDoc comments, use named exports only.',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-blue-500" size={24} />
        <h3 className="text-lg font-semibold text-gray-700">Generate Ruleset with AI</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Describe the rules you want
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Create rules for a Node.js Express API with TypeScript. Require proper error handling, validate environment variables, and enforce async/await patterns."
            className="input min-h-[120px] resize-none"
            disabled={isGenerating}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strictness Level
            </label>
            <select
              value={strictness}
              onChange={(e) => setStrictness(e.target.value as any)}
              className="input"
              disabled={isGenerating}
            >
              <option value="lenient">Lenient - Focus on critical issues</option>
              <option value="moderate">Moderate - Balanced approach</option>
              <option value="strict">Strict - Enforce best practices</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-400"
                disabled={isGenerating}
              />
              <span className="text-sm text-gray-700">Save as reusable template</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle size={16} />
            Ruleset generated successfully!
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Generating with AI...
            </>
          ) : (
            <>
              <Sparkles className="mr-2" size={16} />
              Generate Ruleset
            </>
          )}
        </button>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Example prompts:</p>
          <div className="space-y-1">
            {examplePrompts.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(example)}
                className="text-left text-xs text-blue-600 hover:text-blue-700 hover:underline block"
                disabled={isGenerating}
              >
                • {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
