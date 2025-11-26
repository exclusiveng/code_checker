import React, { useState } from 'react';
import { Lightbulb, Loader2, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
import api from '../api/api';

interface SuggestedRule {
  type: string;
  payload: Record<string, any>;
  severity: string;
  message: string;
  explanation: string;
  addressedIssues: string[];
}

interface AIRuleSuggestionsProps {
  projectId: string;
  onApplySuggestions: (rules: SuggestedRule[]) => void;
}

export const AIRuleSuggestions: React.FC<AIRuleSuggestionsProps> = ({
  projectId,
  onApplySuggestions,
}) => {
  const [suggestions, setSuggestions] = useState<SuggestedRule[]>([]);
  const [summary, setSummary] = useState('');
  const [estimatedImpact, setEstimatedImpact] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [selectedRules, setSelectedRules] = useState<Set<number>>(new Set());

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setHasAnalyzed(false);

    try {
      const response = await api.post('/ai/rulesets/suggest', {
        projectId,
        limit: 50,
      });

      if (response.data.success) {
        const data = response.data.data;
        setSuggestions(data.suggestedRules || []);
        setSummary(data.summary || '');
        setEstimatedImpact(data.estimatedImpact || '0%');
        setHasAnalyzed(true);

        // Select all rules by default
        setSelectedRules(new Set(data.suggestedRules.map((_: any, idx: number) => idx)));
      }
    } catch (err: any) {
      console.error('Failed to get suggestions:', err);
      setError(err.response?.data?.message || 'Failed to analyze submission history');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleRuleSelection = (index: number) => {
    const newSelected = new Set(selectedRules);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRules(newSelected);
  };

  const handleApplySelected = () => {
    const selectedSuggestions = suggestions.filter((_, idx) => selectedRules.has(idx));
    onApplySuggestions(selectedSuggestions);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="text-blue-500" size={24} />
        <h3 className="text-lg font-semibold text-gray-700">AI Rule Suggestions</h3>
      </div>

      {!hasAnalyzed ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Analyze your submission history to discover common issues and get AI-powered rule
            suggestions to prevent them.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Analyzing submission history...
              </>
            ) : (
              <>
                <Lightbulb className="mr-2" size={16} />
                Analyze & Suggest Rules
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="text-blue-600 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">Analysis Summary</h4>
                <p className="text-sm text-blue-700 mb-2">{summary}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-blue-900">Estimated Impact:</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                    {estimatedImpact}
                  </span>
                  <span className="text-blue-600">reduction in common issues</span>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Rules */}
          {suggestions.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <CheckCircle2 className="mx-auto text-green-500 mb-2" size={48} />
              <p className="text-gray-600 font-medium">No suggestions needed!</p>
              <p className="text-sm text-gray-500 mt-1">
                Your submissions are already following best practices.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {suggestions.length} rule{suggestions.length !== 1 ? 's' : ''} suggested
                  ({selectedRules.size} selected)
                </p>
                <button
                  onClick={() => {
                    if (selectedRules.size === suggestions.length) {
                      setSelectedRules(new Set());
                    } else {
                      setSelectedRules(new Set(suggestions.map((_, idx) => idx)));
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedRules.size === suggestions.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {suggestions.map((rule, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-3 transition-all ${
                      selectedRules.has(idx)
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRules.has(idx)}
                        onChange={() => toggleRuleSelection(idx)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-400"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800">{rule.message}</span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full border ${getSeverityColor(
                              rule.severity
                            )}`}
                          >
                            {rule.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rule.explanation}</p>
                        {rule.addressedIssues.length > 0 && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Addresses:</span>
                            <ul className="mt-1 space-y-0.5 ml-4">
                              {rule.addressedIssues.slice(0, 2).map((issue, i) => (
                                <li key={i} className="list-disc">
                                  {issue}
                                </li>
                              ))}
                              {rule.addressedIssues.length > 2 && (
                                <li className="text-gray-400">
                                  +{rule.addressedIssues.length - 2} more
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleApplySelected}
                  disabled={selectedRules.size === 0}
                  className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="mr-2" size={16} />
                  Apply {selectedRules.size} Selected Rule{selectedRules.size !== 1 ? 's' : ''}
                </button>
                <button onClick={() => setHasAnalyzed(false)} className="btn btn-secondary">
                  Analyze Again
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
