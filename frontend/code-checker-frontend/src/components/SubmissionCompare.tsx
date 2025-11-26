import { useState, useEffect } from 'react';
import api from '../api/api';
import { motion } from 'framer-motion';
import { GitCompare, Loader2, AlertCircle, Trophy, TrendingUp, FileCode } from 'lucide-react';
import { Dropdown } from './Dropdown';

interface KeyDifference {
  aspect: string;
  submission1: string;
  submission2: string;
  winner: 'submission1' | 'submission2' | 'tie';
}

interface ComparisonResult {
  summary: string;
  keyDifferences: KeyDifference[];
  overallWinner: 'submission1' | 'submission2' | 'tie';
  reasoning: string;
  recommendations: string[];
  scoreComparison: {
    submission1: number;
    submission2: number;
  };
}

interface Submission {
  id: string;
  createdAt: string;
  project: { name: string };
}

interface SubmissionCompareProps {
  projectId?: string;
}

export const SubmissionCompare: React.FC<SubmissionCompareProps> = ({ projectId }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submission1Id, setSubmission1Id] = useState('');
  const [submission2Id, setSubmission2Id] = useState('');
  const [focus, setFocus] = useState<'all' | 'quality' | 'performance' | 'security'>('all');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await api.get('/submissions');
        setSubmissions(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch submissions:', error);
      }
    };
    fetchSubmissions();
  }, []);

  const handleCompare = async () => {
    if (!submission1Id || !submission2Id) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/ai/compare/submissions', {
        submission1Id,
        submission2Id,
        focus,
      });
      setResult(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to compare submissions');
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWinnerBadge = (winner: string) => {
    if (winner === 'tie') return <span className="text-gray-600 text-sm">Tie</span>;
    return <Trophy className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Compare Submissions</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Select two submissions to compare with AI-powered analysis
        </p>
      </div>

      {/* Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Dropdown
            label="Submission 1"
            options={submissions.map(sub => ({
              id: sub.id,
              label: sub.project.name,
              subLabel: new Date(sub.createdAt).toLocaleDateString(),
              icon: <FileCode className="w-4 h-4" />
            }))}
            selectedId={submission1Id || null}
            onSelect={(id) => setSubmission1Id(id)}
            placeholder="Select submission"
            icon={<FileCode className="w-5 h-5" />}
          />
        </div>

        <div>
          <Dropdown
            label="Submission 2"
            options={submissions.map(sub => ({
              id: sub.id,
              label: sub.project.name,
              subLabel: new Date(sub.createdAt).toLocaleDateString(),
              icon: <FileCode className="w-4 h-4" />,
              disabled: sub.id === submission1Id,
              disabledReason: sub.id === submission1Id ? 'Already selected as Submission 1' : undefined
            }))}
            selectedId={submission2Id || null}
            onSelect={(id) => setSubmission2Id(id)}
            placeholder="Select submission"
            icon={<FileCode className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Focus */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comparison Focus
        </label>
        <div className="flex gap-2">
          {(['all', 'quality', 'performance', 'security'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFocus(f)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                focus === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Compare Button */}
      <button
        onClick={handleCompare}
        disabled={loading || !submission1Id || !submission2Id}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Comparing...
          </>
        ) : (
          <>
            <GitCompare className="w-5 h-5" />
            Compare Submissions
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Summary</h3>
            <p className="text-gray-700 mb-4">{result.summary}</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Submission 1</p>
                <p className="text-3xl font-bold text-blue-600">{result.scoreComparison.submission1}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-gray-400" />
              <div className="flex-1 text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Submission 2</p>
                <p className="text-3xl font-bold text-blue-600">{result.scoreComparison.submission2}</p>
              </div>
            </div>
          </div>

          {/* Key Differences */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Differences</h3>
            <div className="space-y-3">
              {result.keyDifferences.map((diff, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    {diff.aspect}
                    {getWinnerBadge(diff.winner)}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className={`p-3 rounded-lg ${diff.winner === 'submission1' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      <p className="font-medium text-gray-700 mb-1">Submission 1:</p>
                      <p className="text-gray-600">{diff.submission1}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${diff.winner === 'submission2' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      <p className="font-medium text-gray-700 mb-1">Submission 2:</p>
                      <p className="text-gray-600">{diff.submission2}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Winner & Reasoning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Overall Winner: {result.overallWinner === 'tie' ? 'Tie' : `Submission ${result.overallWinner.slice(-1)}`}
            </h3>
            <p className="text-gray-700">{result.reasoning}</p>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-600 font-bold">{idx + 1}.</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
