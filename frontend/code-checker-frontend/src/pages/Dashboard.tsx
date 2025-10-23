import { useState, useEffect } from 'react';
import {UploadForm} from '../components/UploadForm';
import { SubmissionList } from '../components/SubmissionList';
import { ProjectList } from '../components/ProjectList'; 
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Calendar, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RulesetManager } from '../components/RulesetManager';
import { UserManagement } from '../components/UserManagement';

export default function Dashboard() {
  const { user, logout, isAuthenticated, isVerifying, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'projects' | 'submissions' | 'upload' | 'rulesets' | 'users'>('projects');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isVerifying && !isLoading && !isAuthenticated) {
      console.warn('[Dashboard] No valid session found, redirecting to login.');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isVerifying, isLoading, navigate]);

  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        <div className="text-lg font-medium">Loading your dashboard...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Navbar */}
      <header className="flex justify-between items-center px-6 py-4 bg-blue-600 text-white shadow-md">
        <h1 className="text-xl font-semibold tracking-wide">Remote Code Tester</h1>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block font-medium">{user?.name || 'Guest'}</span>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1 bg-blue-800 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: User Profile */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
          <div className="mt-8 space-y-4 text-sm">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-3 text-gray-400" />
              <span className="text-gray-600">Role:</span>
              <span className="font-semibold text-gray-800 ml-2 capitalize">{user?.role}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-3 text-gray-400" />
              <span className="text-gray-600">Member since:</span>
              <span className="font-semibold text-gray-800 ml-2">
                {user && user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </motion.aside>

        {/* Right Content: Tabs and Content */}
        <div className="lg:col-span-3">
          {/* Tabs Navigation */}
          <nav className="flex gap-2 p-1 bg-gray-200/50 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'projects'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'submissions'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              Submissions
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'upload'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              Upload
            </button>
            <button
              onClick={() => setActiveTab('rulesets')}
              className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'rulesets'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              Rule Sets
            </button>
            {user?.role === 'super_admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  activeTab === 'users' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                Users
              </button>
            )}
          </nav>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            {activeTab === 'projects' && <ProjectList />}
            {activeTab === 'submissions' && <SubmissionList />}
            {activeTab === 'upload' && (
              <UploadForm
                onUploadComplete={() => {
                  setActiveTab('submissions');
                }}
              />
            )}
            {activeTab === 'rulesets' && user?.role === 'super_admin' && <RulesetManager />}
            {activeTab === 'users' && user?.role === 'super_admin' && <UserManagement />}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 border-t bg-white text-sm text-gray-600">
        © {new Date().getFullYear()} Code Checker Platform.
      </footer>
    </div>
  );
}
