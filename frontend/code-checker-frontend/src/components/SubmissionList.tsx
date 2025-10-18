import { useState, useEffect } from 'react';
import api from '../api/api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileCode, CheckCircle, XCircle, Clock } from 'lucide-react';

// Define the types for our data structure
interface Project {
  id: string;
  name: string;
}

interface Submission {
  id: string;
  status: 'PENDING' | 'ANALYZING' | 'REVIEWED' | 'FAILED';
  createdAt: string;
  project: Project;
}

interface PaginationMeta {
  total: number;
  page: number;
  last_page: number;
}

const statusIcons = {
  PENDING: <Clock className="text-yellow-500" size={18} />,
  ANALYZING: <Clock className="text-blue-500 animate-spin" size={18} />,
  REVIEWED: <CheckCircle className="text-green-500" size={18} />,
  FAILED: <XCircle className="text-red-500" size={18} />,
};

export const SubmissionList = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/submissions?page=${currentPage}`);
        // This is the key fix: access the 'data' property of the response
        setSubmissions(response.data.data);
        setMeta(response.data.meta);
      } catch (err) {
        setError('Failed to fetch submissions. Please try again later.');
        console.error('Failed to fetch submissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [currentPage]);

  if (loading) {
    return <div className="text-center p-8">Loading submissions...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {submissions.length === 0 ? (
        <p className="text-center text-gray-500 p-8">You have not made any submissions yet.</p>
      ) : (
        submissions.map((submission, index) => (
          <motion.div
            key={submission.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 border rounded-lg hover:bg-gray-50/80 transition-colors"
          >
            <Link to={`/submissions/${submission.id}`} className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <FileCode className="text-gray-400" size={24} />
                <div>
                  <p className="font-semibold text-gray-800">Submission to "{submission.project.name}"</p>
                  <p className="text-xs text-gray-500">Submitted on {new Date(submission.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium capitalize">
                {statusIcons[submission.status]}
                <span className={`text-${submission.status === 'FAILED' ? 'red' : 'gray'}-600`}>{submission.status.toLowerCase()}</span>
              </div>
            </Link>
          </motion.div>
        ))
      )}

      {meta && meta.total > 10 && (
        <div className="flex justify-between items-center pt-4 border-t mt-6">
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium bg-white border rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><ChevronLeft size={16} /> Previous</button>
          <span className="text-sm text-gray-600">Page {meta.page} of {meta.last_page}</span>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === meta.last_page} className="px-4 py-2 text-sm font-medium bg-white border rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">Next <ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
};