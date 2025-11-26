import { useState, useEffect } from 'react';
import api from '../api/api';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Lightbulb, Activity, AlertCircle, Loader2 } from 'lucide-react';

interface KeyIssue {
  title: string;
  description: string;
  severity?: 'critical' | 'error' | 'warning' | 'info';
}

interface SubmissionReport {
  summary: string;
  keyIssues: KeyIssue[];
  actionableAdvice: string[];
  score: number;
}

interface ImprovementStrategy {
  title: string;
  description: string;
}

interface ProjectInsightsData {
  trendAnalysis: string;
  improvementStrategy: ImprovementStrategy[];
  teamFocus: string[];
  healthScore: number;
}

interface ProjectInsightsProps {
  projectId?: string;
  submissionId?: string;
  mode: 'project' | 'submission';
}

const severityColors = {
  critical: 'bg-red-100 border-red-300 text-red-800',
  error: 'bg-orange-100 border-orange-300 text-orange-800',
  warning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  info: 'bg-blue-100 border-blue-300 text-blue-800',
};

export const ProjectInsights: React.FC<ProjectInsightsProps> = ({ projectId, submissionId, mode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectInsights, setProjectInsights] = useState<ProjectInsightsData | null>(null);
  const [submissionReport, setSubmissionReport] = useState<SubmissionReport | null>(null);

  useEffect(() => {
    if (mode === 'project' && projectId) {
      fetchProjectInsights();
    } else if (mode === 'submission' && submissionId) {
      fetchSubmissionReport();
    }
  }, [projectId, submissionId, mode]);

  const fetchProjectInsights = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/ai/report/project/${projectId}?limit=20`);
      setProjectInsights(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate insights');
      console.error('Failed to fetch project insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionReport = async () => {
    if (!submissionId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/ai/report/submission/${submissionId}`);
      setSubmissionReport(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
      console.error('Failed to fetch submission report:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">Generating AI insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  if (mode === 'submission' && submissionReport) {
    return (
      <div className="space-y-6">
        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Quality Score</h3>
              <p className="text-gray-600 text-sm">{submissionReport.summary}</p>
            </div>
            <div className={`text-5xl font-bold ${getScoreColor(submissionReport.score)}`}>
              {submissionReport.score}
            </div>
          </div>
        </motion.div>

        {/* Key Issues */}
        {submissionReport.keyIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Key Issues
            </h3>
            <div className="space-y-3">
              {submissionReport.keyIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-4 border rounded-lg ${severityColors[issue.severity || 'warning']}`}
                >
                  <h4 className="font-semibold mb-1">{issue.title}</h4>
                  <p className="text-sm">{issue.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actionable Advice */}
        {submissionReport.actionableAdvice.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Actionable Advice
            </h3>
            <ul className="space-y-2">
              {submissionReport.actionableAdvice.map((advice, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-blue-600 font-bold">{idx + 1}.</span>
                  <span className="text-gray-700">{advice}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    );
  }

  if (mode === 'project' && projectInsights) {
    return (
      <div className="space-y-6">
        {/* Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Project Health
              </h3>
              <p className="text-gray-600 text-sm max-w-2xl">{projectInsights.trendAnalysis}</p>
            </div>
            <div className={`text-5xl font-bold ${getScoreColor(projectInsights.healthScore)}`}>
              {projectInsights.healthScore}
            </div>
          </div>
        </motion.div>

        {/* Improvement Strategy */}
        {projectInsights.improvementStrategy.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Improvement Strategy
            </h3>
            <div className="space-y-4">
              {projectInsights.improvementStrategy.map((strategy, idx) => (
                <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">{strategy.title}</h4>
                  <p className="text-sm text-blue-800">{strategy.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Team Focus Areas */}
        {projectInsights.teamFocus.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Team Focus Areas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projectInsights.teamFocus.map((focus, idx) => (
                <div key={idx} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-900 font-medium">{focus}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center p-12 text-gray-500">
      <p>No insights available. Please select a project or submission.</p>
    </div>
  );
};
