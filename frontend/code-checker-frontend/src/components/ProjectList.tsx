import { useState, useEffect } from 'react';
import api from '../api/api';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { ChevronLeft, ChevronRight, GitBranch, ShieldCheck } from 'lucide-react';

// Define the types for our data structure
interface Ruleset {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  repoUrl: string;
  createdAt: string;
  rulesets: Ruleset[];
}

interface PaginationMeta {
  total: number;
  page: number;
  last_page: number;
}

export const ProjectList = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!user?.companyId) return;

    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(
          `/companies/${user.companyId}/projects?page=${currentPage}`
        );
        setProjects(response.data.data);
        setMeta(response.data.meta);
      } catch (err) {
        setError('Failed to fetch projects. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentPage, user?.companyId]);

  if (loading) {
    return <div className="text-center p-8">Loading projects...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {projects.length === 0 ? (
        <p className="text-center text-gray-500 p-8">No projects found.</p>
      ) : (
        projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 border rounded-lg bg-gray-50/50"
          >
            <h3 className="font-semibold text-lg text-blue-700">{project.name}</h3>
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:underline flex items-center gap-2 mt-1">
              <GitBranch size={14} /> {project.repoUrl}
            </a>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.rulesets.map(ruleset => (
                <span key={ruleset.id} className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1.5">
                  <ShieldCheck size={12} /> {ruleset.name}
                </span>
              ))}
            </div>
          </motion.div>
        ))
      )}

      {meta && meta.total > 10 && (
        <div className="flex justify-between items-center pt-4 border-t">
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium bg-white border rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><ChevronLeft size={16} /> Previous</button>
          <span className="text-sm text-gray-600">Page {meta.page} of {meta.last_page}</span>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === meta.last_page} className="px-4 py-2 text-sm font-medium bg-white border rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">Next <ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
};