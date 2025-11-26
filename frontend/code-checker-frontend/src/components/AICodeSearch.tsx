import { useState } from 'react';
import api from '../api/api';
import { motion } from 'framer-motion';
import { Search, Code, Loader2, AlertCircle, Lightbulb, FileCode } from 'lucide-react';

interface CodeExample {
  submissionId: string;
  snippet: string;
  explanation: string;
}

interface QueryResult {
  answer: string;
  codeExamples: CodeExample[];
  relatedFindings: string[];
  confidence: number;
}

interface AICodeSearchProps {
  projectId: string;
}

export const AICodeSearch: React.FC<AICodeSearchProps> = ({ projectId }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/ai/query/codebase', {
        projectId,
        query,
        limit: 10,
      });
      setResult(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process query');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Ask About Your Code</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Ask natural language questions about your codebase. For example: "Are there any security vulnerabilities?" or "Which submissions use async/await?"
        </p>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ask a question about your code..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Answer */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                Answer
              </h3>
              <span className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                {Math.round(result.confidence * 100)}% confident
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{result.answer}</p>
          </div>

          {/* Code Examples */}
          {result.codeExamples.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-600" />
                Code Examples
              </h3>
              <div className="space-y-4">
                {result.codeExamples.map((example, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileCode className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-mono text-gray-600">
                        Submission: {example.submissionId}
                      </span>
                    </div>
                    <pre className="bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto text-sm mb-2">
                      <code>{example.snippet}</code>
                    </pre>
                    <p className="text-sm text-gray-600 italic">{example.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Findings */}
          {result.relatedFindings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Related Insights</h3>
              <ul className="space-y-2">
                {result.relatedFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Example Queries */}
      {!result && !loading && (
        <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
          <h4 className="font-medium text-gray-700 mb-3">Example Questions:</h4>
          <div className="space-y-2">
            {[
              'Are there any security vulnerabilities in the code?',
              'Which submissions use async/await patterns?',
              'Show me examples of error handling',
              'What are the most common code quality issues?',
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-white hover:text-blue-600 rounded-lg transition-colors"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
