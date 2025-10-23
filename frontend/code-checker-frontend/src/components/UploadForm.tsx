import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, FileArchive, X } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';

interface UploadFormProps {
  onUploadComplete?: (submissionId: string) => void;
}

interface Project {
  id: string;
  name: string;
  slug?: string;
  rulesets?: any[];
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
  const [isDragging, setIsDragging] = useState(false);

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
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    // Validate file type
    if (!selectedFile.name.endsWith('.zip')) {
      setError('Invalid file type. Please upload a .zip file.');
      return;
    }
    // Validate file size (e.g., 20MB limit)
    const maxSizeInBytes = 20 * 1024 * 1024;
    if (selectedFile.size > maxSizeInBytes) {
      setError(`File is too large. Maximum size is ${maxSizeInBytes / 1024 / 1024}MB.`);
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !projectId) {
      setError('Please select a project and a ZIP file.');
      return;
    }

    const selectedProject = projects.find((p) => p.id === projectId);
    if (selectedProject && (!selectedProject.rulesets || selectedProject.rulesets.length === 0)) {
      setError('Selected project has no rulesets — please create or assign a ruleset before uploading.');
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
      setMessage('Upload successful! Your submission is now queued for analysis.');
      if (onUploadComplete && submissionId) {
        onUploadComplete(submissionId);
      }
      setFile(null);
      setProjectId('');
      // Clear success message after a few seconds
      setTimeout(() => setMessage(null), 5000);
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-gray-200 shadow-md rounded-2xl p-6 mt-10">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Code ZIP</h2>
      <p className="text-gray-500 text-sm mb-6">
        Submit your project’s ZIP file for automated rule-based analysis.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <option
                  key={project.id}
                  value={project.id}
                  disabled={!project.rulesets || project.rulesets.length === 0}
                >
                  {project.name} {project.slug ? `(${project.slug})` : ''}
                  {(!project.rulesets || project.rulesets.length === 0) ? ' (no rulesets)' : ''}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP File</label>
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="file-display"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <FileArchive size={20} />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <button type="button" onClick={() => setFile(null)} className="text-blue-600 hover:text-blue-800">
                  <X size={18} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                  ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">ZIP file (max 20MB)</p>
                </div>
                <input type="file" accept=".zip" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">{error}</motion.div>}
          {message && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">{message}</motion.div>}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading || !file || !projectId}
          className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload & Analyze
            </>
          )}
        </button>
      </form>
    </div>
  );
};
