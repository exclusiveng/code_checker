import React, { useState, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';

interface UploadFormProps {
  onUploadComplete?: (submissionId: string) => void;
}

interface Project {
  id: string;
  name: string;
}

export const UploadForm: React.FC<UploadFormProps> = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.companyId) return;

    const fetchAllProjects = async () => {
      setProjectsLoading(true);
      try {
        const response = await api.get(`/companies/${user.companyId}/projects?limit=1000`);
        setProjects(response.data.data);
      } catch (err) {
        console.error('Failed to fetch projects for upload form', err);
        setError('Could not load projects.');
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchAllProjects();
  }, [user?.companyId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !projectId) {
      setError('Please select a project and a ZIP file.');
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      setError(null);

      const formData = new FormData();
      formData.append('submissionFile', file);
      formData.append('projectId', projectId);

      const response = await api.post('/submissions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const submissionId = response.data?.submission?.id;
      setMessage('File uploaded successfully! Submission queued for analysis.');
      if (onUploadComplete && submissionId) {
        onUploadComplete(submissionId);
      }
      setFile(null);
      setProjectId('');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          'Upload failed. Please try again or contact support.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-gray-200 shadow-md rounded-2xl p-6 mt-10">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Code ZIP</h2>
      <p className="text-gray-500 text-sm mb-6">
        Submit your project’s ZIP file for automated rule-based analysis.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={projectsLoading}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 disabled:bg-gray-100"
          >
            <option value="" disabled>
              {projectsLoading ? 'Loading projects...' : 'Select a project'}
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose ZIP File
          </label>
          <input
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0 file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload
            </>
          )}
        </button>
      </form>
    </div>
  );
};
