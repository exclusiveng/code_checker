import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, CheckCircle, XCircle, Clock, AlertTriangle, Info, GitBranch, Loader2, Sparkles } from 'lucide-react';
import { RuleFindingCard } from '../components/RuleFindingCard';
import { ProjectInsights } from '../components/ProjectInsights';

interface SubmissionFinding {
  ruleId?: string;
  severity: string;
  message: string;
  file?: string;
}

interface Project {
  id: string;
  name: string;
  repoUrl: string;
}

interface Submission {
  id: string;
  zipUrl: string;
  createdAt: string;
  status: string;
  project: Project;
  results?: {
    findings: SubmissionFinding[];
  };
}

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'findings' | 'insights'>('findings');

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await api.get(`/submissions/${id}/status`);
        setSubmission(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch submission details');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="animate-spin" /> Loading submission details...
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-red-500 font-medium">{error || 'Submission not found'}</p>
      </div>
    );
  }

  const statusInfo = {
    REVIEWED: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
    FAILED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    PENDING: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    ANALYZING: { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  }[submission.status] || { icon: AlertTriangle, color: 'text-gray-600', bgColor: 'bg-gray-100' };

  const StatusIcon = statusInfo.icon;

  const findings = submission.results?.findings || [];
  const severityCounts = findings.reduce((acc, finding) => {
    acc[finding.severity.toLowerCase()] = (acc[finding.severity.toLowerCase()] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.bgColor} ${statusInfo.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="capitalize">
              {submission.status.toLowerCase()}
            </span>
          </div>
        </div>

        <div className="mb-8 border-b pb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Submission for "{submission.project.name}"
          </h2>
          <p className="text-gray-500 text-sm">
            ID: {submission.id}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Uploaded on{' '}
            {new Date(submission.createdAt).toLocaleString()}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <SummaryCard icon={Info} label="Critical" value={severityCounts.critical || 0} color="text-red-500" />
            <SummaryCard icon={AlertTriangle} label="Errors" value={severityCounts.error || 0} color="text-orange-500" />
            <SummaryCard icon={AlertTriangle} label="Warnings" value={severityCounts.warning || 0} color="text-yellow-500" />
            <SummaryCard icon={CheckCircle} label="Infos" value={severityCounts.info || 0} color="text-blue-500" />
          </div>

          {/* Tabs */}
          <nav className="flex gap-2 p-1 bg-gray-200/50 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('findings')}
              className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'findings'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Detailed Findings
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'insights'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              AI Insights
            </button>
          </nav>

          {activeTab === 'findings' && (
            <>
              <h3 className="font-semibold text-xl text-gray-700 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-500" />
                Detailed Findings
              </h3>

              {findings.length > 0 ? (
                <div className="space-y-4">
                  <AnimatePresence>
                    {findings.map((finding, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <RuleFindingCard finding={finding} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {submission.status === 'PENDING' || submission.status === 'ANALYZING'
                    ? 'Analysis is in progress. Findings will appear here once complete.'
                    : 'No rule findings were reported for this submission.'}
                </p>
              )}
            </>
          )}

          {activeTab === 'insights' && (
            <ProjectInsights mode="submission" submissionId={id} />
          )}
        </motion.div>
      </div>
    </div>
  );
}

const SummaryCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: number, color: string }) => (
  <div className="bg-gray-50/80 border rounded-lg p-4 flex items-center gap-4">
    <Icon className={`${color} w-8 h-8`} />
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);
